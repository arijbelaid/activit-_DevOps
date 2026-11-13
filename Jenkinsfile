pipeline {
    agent any

    tools {
        nodejs 'nodejs-22'
    }

    environment {
        HARBOR_URL = "192.168.159.129"
        HARBOR_PROJECT = "library"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Récupération du dépôt GitHub...'
                checkout scm
                script {
                    def branch = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                    def commit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "📚 Branche : ${branch}"
                    echo "🔖 Commit : ${commit}"
                }
            }
        }

        stage('Verify') {
            steps {
                echo '✅ Vérification des fichiers du projet...'
                sh 'ls -la'
                sh 'test -f index.html && echo "✓ index.html trouvé"'
                sh 'test -f nextjs-portfolio/package.json && echo "✓ nextjs-portfolio/package.json trouvé"'
            }
        }

        stage('Secret Scan (Gitleaks)') {
            steps {
                echo '🔍 Analyse des secrets avec Gitleaks...'
                sh '''
                    docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest \
                    detect --source /repo --report-format json \
                    --report-path /repo/gitleaks.json --exit-code 1
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'gitleaks.json', allowEmptyArchive: true
                }
            }
        }

        stage('Semgrep SAST') {
            steps {
                echo '🛡️ Analyse de sécurité statique (SAST) avec Semgrep...'
                sh '''
                    docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep:latest \
                    semgrep scan --config auto --error \
                    --exclude 'node_modules' --exclude '.next' --exclude 'dist' --exclude '.vagrant' \
                    --exclude-rule javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage \
                    --exclude-rule typescript.react.security.react-insecure-request.react-insecure-request \
                    --exclude-rule javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring \
                    --exclude-rule package_managers.dependabot.dependabot-missing-cooldown.dependabot-missing-cooldown \
                    --exclude-rule yaml.github-actions.security.github-actions-mutable-action-tag.github-actions-mutable-action-tag
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installation des dépendances API et Next.js...'
                dir('api') {
                    sh 'npm install'
                }
                dir('nextjs-portfolio') {
                    sh 'node --version'
                    sh 'npm --version'
                    sh 'npm install'
                }
            }
        }

        stage('Dependency Scan (npm audit)') {
            steps {
                echo '🔎 Analyse des dépendances avec npm audit...'
                dir('api') {
                    sh 'npm audit --audit-level=high || true'
                }
                dir('nextjs-portfolio') {
                    sh 'npm audit --audit-level=high || true'
                }
            }
        }

        stage('API Tests') {
            steps {
                echo "🧪 Exécution des tests unitaires de l'API..."
                dir('api') {
                    sh 'npm run test -- __tests__/api.test.js'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                echo '🧪 Exécution des tests du Frontend...'
                dir('nextjs-portfolio') {
                    sh 'npm run test'
                }
            }
        }

        stage('Build') {
            steps {
                echo "🏗️ Construction de l'application Next.js..."
                dir('nextjs-portfolio') {
                    sh 'npm run build'
                    sh 'ls -la .next/ | head -10'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "🐳 Construction des images Docker avec BuildKit et le tag : ${gitSha}"

                    sh "DOCKER_BUILDKIT=1 docker build -t devsecops-api:${gitSha} ./api"
                    sh "DOCKER_BUILDKIT=1 docker build -t devsecops-portfolio:${gitSha} ./nextjs-portfolio"

                    sh "docker tag devsecops-api:${gitSha} devsecops-api:latest"
                    sh "docker tag devsecops-portfolio:${gitSha} devsecops-portfolio:latest"
                }
            }
        }

        stage('Generate SBOM with Syft') {
            steps {
                script {
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "📄 Génération des SBOM avec Syft pour les images..."

                    sh """
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock anchore/syft:latest \
                        docker:devsecops-api:${gitSha} \
                        -o spdx-json > sbom-api-${gitSha}.spdx.json
                    """
                    sh """
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock anchore/syft:latest \
                        docker:devsecops-portfolio:${gitSha} \
                        -o spdx-json > sbom-frontend-${gitSha}.spdx.json
                    """
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom-*.spdx.json', allowEmptyArchive: true
                }
            }
        }

        stage('Push to Harbor') {
            steps {
                script {
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "🚢 Publication des images vers Harbor avec le Robot Account..."

                    sh "docker login ${HARBOR_URL} -u 'robot\$library+robot-jenkins' -p '78Q8ns1zxwyuLaWK5sOx7pDun1hmB9aG'"

                    // Tag pour Harbor (API)
                    sh "docker tag devsecops-api:${gitSha} ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-api:${gitSha}"
                    sh "docker tag devsecops-api:${gitSha} ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-api:latest"

                    // Tag pour Harbor (Frontend)
                    sh "docker tag devsecops-portfolio:${gitSha} ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-portfolio:${gitSha}"
                    sh "docker tag devsecops-portfolio:${gitSha} ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-portfolio:latest"

                    // Push vers Harbor
                    sh "docker push ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-api:${gitSha}"
                    sh "docker push ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-api:latest"
                    sh "docker push ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-portfolio:${gitSha}"
                    sh "docker push ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-portfolio:latest"
                }
            }
        }

        // ⬇️ STAGE Q99 : SIGNATURE ⬇️
        stage('Sign Images with Cosign') {
            steps {
                script {
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "✍️ Signature des images avec Cosign..."
                    
                    withCredentials([
                        file(credentialsId: 'cosign-private-key', variable: 'COSIGN_PRIVATE_KEY'),
                        string(credentialsId: 'cosign-password', variable: 'COSIGN_PASSWORD')
                    ]) {
                        // Signer l'image API
                        sh """
                            IMAGE_DIGEST=\$(docker inspect --format='{{index .RepoDigests 0}}' ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-api:${gitSha})
                            cosign sign --key \$COSIGN_PRIVATE_KEY -y \$IMAGE_DIGEST
                        """
                        // Signer l'image Frontend
                        sh """
                            IMAGE_DIGEST=\$(docker inspect --format='{{index .RepoDigests 0}}' ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-portfolio:${gitSha})
                            cosign sign --key \$COSIGN_PRIVATE_KEY -y \$IMAGE_DIGEST
                        """
                    }
                }
            }
        }

        // ⬇️ STAGE Q100 : VÉRIFICATION AVANT UTILISATION ⬇️
        stage('Verify Image Signature') {
            steps {
                script {
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "🕵️ Vérification de la signature des images avant utilisation..."
                    
                    withCredentials([
                        file(credentialsId: 'cosign-public-key', variable: 'COSIGN_PUBLIC_KEY')
                    ]) {
                        // Vérifier l'image API
                        sh """
                            IMAGE_DIGEST=\$(docker inspect --format='{{index .RepoDigests 0}}' ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-api:${gitSha})
                            cosign verify --key \$COSIGN_PUBLIC_KEY \$IMAGE_DIGEST
                        """
                        // Vérifier l'image Frontend
                        sh """
                            IMAGE_DIGEST=\$(docker inspect --format='{{index .RepoDigests 0}}' ${HARBOR_URL}/${HARBOR_PROJECT}/devsecops-portfolio:${gitSha})
                            cosign verify --key \$COSIGN_PUBLIC_KEY \$IMAGE_DIGEST
                        """
                    }
                }
            }
        }

    }

    post {
        success {
            echo '✅ Pipeline terminé avec succès !'
        }
        failure {
            echo '❌ Le pipeline a échoué.'
        }
    }
}
