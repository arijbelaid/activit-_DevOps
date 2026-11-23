pipeline {
    agent any

    tools {
        nodejs 'nodejs-22'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        HARBOR_URL     = '192.168.159.129'
        HARBOR_PROJECT = 'devsecops-portfolio'
        GITOPS_REPO    = 'git@github.com:arijbelaid/devsecops-portfolio-gitops.git'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Commit : ${env.GIT_SHA}"
                }
            }
        }

        // 1) Test du frontend
        stage('Frontend Tests') {
            steps {
                dir('nextjs-portfolio') {
                    sh 'npm install'
                    sh 'npm run test'
                }
            }
        }

        // 2) Test de l'API
        stage('API Tests') {
            steps {
                dir('api') {
                    sh 'npm install'
                    sh 'npm run test -- __tests__/api.test.js'
                }
            }
        }

        // 3) Scans de securite
        stage('Secret Scan (Gitleaks)') {
            steps {
                sh '''
                    docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest \
                    detect --source /repo --report-format json \
                    --report-path /repo/gitleaks.json --exit-code 1 || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'gitleaks.json', allowEmptyArchive: true
                }
            }
        }

        stage('SAST (Semgrep)') {
            steps {
                sh '''
                    docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep:latest \
                    semgrep scan --config auto --error \
                    --exclude node_modules --exclude .next --exclude dist --exclude .vagrant || true
                '''
            }
        }

        stage('IaC Scan (Checkov)') {
            steps {
                sh '''
                    docker run --rm -v "$PWD:/workspace" -w /workspace \
                    bridgecrew/checkov:latest -d terraform-floci --framework terraform || true
                '''
            }
        }

        stage('Dependency Scan (npm audit)') {
            steps {
                dir('api') {
                    sh 'npm audit --audit-level=high || true'
                }
                dir('nextjs-portfolio') {
                    sh 'npm audit --audit-level=high || true'
                }
            }
        }

        // 4) Construction des images
        stage('Build Images') {
            steps {
                sh '''
                    DOCKER_BUILDKIT=1 docker build -t $HARBOR_URL/$HARBOR_PROJECT/api:$GIT_SHA ./api
                    DOCKER_BUILDKIT=1 docker build -t $HARBOR_URL/$HARBOR_PROJECT/frontend:$GIT_SHA ./nextjs-portfolio
                '''
            }
        }

        // 5) SBOM
        stage('SBOM (Syft)') {
            steps {
                sh '''
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock anchore/syft:latest \
                    docker:$HARBOR_URL/$HARBOR_PROJECT/api:$GIT_SHA -o spdx-json > sbom-api-$GIT_SHA.spdx.json
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock anchore/syft:latest \
                    docker:$HARBOR_URL/$HARBOR_PROJECT/frontend:$GIT_SHA -o spdx-json > sbom-frontend-$GIT_SHA.spdx.json
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom-*.spdx.json', allowEmptyArchive: true
                }
            }
        }

        // 6) Publication dans Harbor (avant la signature : Cosign signe un digest du registre)
        stage('Push to Harbor') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'harbor-robot',
                                                  usernameVariable: 'HUSER',
                                                  passwordVariable: 'HPASS')]) {
                    sh '''
                        echo "$HPASS" | docker login $HARBOR_URL -u "$HUSER" --password-stdin
                        docker push $HARBOR_URL/$HARBOR_PROJECT/api:$GIT_SHA
                        docker push $HARBOR_URL/$HARBOR_PROJECT/frontend:$GIT_SHA
                    '''
                }
                script {
                    env.API_DIGEST = sh(
                        script: "docker inspect --format='{{index .RepoDigests 0}}' ${HARBOR_URL}/${HARBOR_PROJECT}/api:${GIT_SHA} | cut -d@ -f2",
                        returnStdout: true).trim()
                    env.FRONT_DIGEST = sh(
                        script: "docker inspect --format='{{index .RepoDigests 0}}' ${HARBOR_URL}/${HARBOR_PROJECT}/frontend:${GIT_SHA} | cut -d@ -f2",
                        returnStdout: true).trim()
                    echo "API      : ${env.API_DIGEST}"
                    echo "Frontend : ${env.FRONT_DIGEST}"
                }
            }
        }

        // 7) Signature des images
        stage('Sign Images (Cosign)') {
            steps {
                withCredentials([
                    file(credentialsId: 'cosign-private-key', variable: 'COSIGN_KEY'),
                    string(credentialsId: 'cosign-password', variable: 'COSIGN_PASSWORD')
                ]) {
                    sh '''
                        cosign sign --key "$COSIGN_KEY" --allow-insecure-registry --tlog-upload=false -y \
                          $HARBOR_URL/$HARBOR_PROJECT/api@$API_DIGEST
                        cosign sign --key "$COSIGN_KEY" --allow-insecure-registry --tlog-upload=false -y \
                          $HARBOR_URL/$HARBOR_PROJECT/frontend@$FRONT_DIGEST
                    '''
                }
            }
        }

        stage('Verify Signatures') {
            steps {
                withCredentials([file(credentialsId: 'cosign-public-key', variable: 'COSIGN_PUB')]) {
                    sh '''
                        cosign verify --key "$COSIGN_PUB" --allow-insecure-registry --insecure-ignore-tlog=true \
                          $HARBOR_URL/$HARBOR_PROJECT/api@$API_DIGEST
                        cosign verify --key "$COSIGN_PUB" --allow-insecure-registry --insecure-ignore-tlog=true \
                          $HARBOR_URL/$HARBOR_PROJECT/frontend@$FRONT_DIGEST
                    '''
                }
            }
        }

        // 8) Mise a jour du depot GitOps (overlay dev)
        stage('Update GitOps Repo') {
            steps {
                sshagent(['gitops-ssh']) {
                    sh '''
                        set -e
                        rm -rf gitops
                        GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git clone $GITOPS_REPO gitops
                        cd gitops
                        F=overlays/dev/kustomization.yaml
                        awk -v api="$API_DIGEST" -v fe="$FRONT_DIGEST" '
                          index($0,"/api") && /name:/ {print; getline; sub(/digest: .*/,"digest: " api); print; next}
                          index($0,"/frontend") && /name:/ {print; getline; sub(/digest: .*/,"digest: " fe); print; next}
                          {print}' $F > $F.new
                        mv $F.new $F
                        git config user.email "jenkins@local"
                        git config user.name "jenkins"
                        if git diff --quiet; then
                          echo "Aucun changement a pousser"
                        else
                          git commit -am "ci: build $GIT_SHA (api=$API_DIGEST frontend=$FRONT_DIGEST)"
                          GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git push origin main
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout $HARBOR_URL || true'
        }
        success {
            echo 'Pipeline termine avec succes.'
        }
        failure {
            echo 'Le pipeline a echoue.'
        }
    }
}
