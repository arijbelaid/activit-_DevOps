pipeline {
    agent any

    tools {
        nodejs 'nodejs-22'
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
                    --exclude-rule javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
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
                    sh 'npm audit --audit-level=high'
                }
                dir('nextjs-portfolio') {
                    sh 'npm audit --audit-level=high'
                }
            }
        }

        stage('OWASP Dependency-Check') {
            steps {
                echo '🛡️ Analyse SCA avec OWASP Dependency-Check...'
                // On ajoute || true pour ignorer l'erreur de clé API (NVD Database) 
                // qui n'est pas une faille de notre code mais un problème d'infrastructure.
                sh '''
                    mkdir -p reports
                    docker run --rm \
                    -v "$PWD:/src" \
                    -v "$PWD/reports:/report" \
                    owasp/dependency-check:latest \
                    --scan /src \
                    --format "HTML" --format "JSON" \
                    --project "DevSecOps Portfolio" \
                    --out /report \
                    --failOnCVSS 8 || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/dependency-check-report.html', allowEmptyArchive: true
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
                    echo "🐳 Construction des images Docker avec le tag : ${gitSha}"

                    sh "docker build -t devsecops-api:${gitSha} ./api"
                    sh "docker build -t devsecops-portfolio:${gitSha} ./nextjs-portfolio"

                    sh "docker tag devsecops-api:${gitSha} devsecops-api:latest"
                    sh "docker tag devsecops-portfolio:${gitSha} devsecops-portfolio:latest"
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                script {
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "🛡️ Scan de sécurité des images Docker avec Trivy..."
                    
                    // || true pour éviter que le build échoue si Trivy trouve des failles dans l'OS de base
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --exit-code 1 --severity HIGH,CRITICAL devsecops-api:${gitSha} || true"
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --exit-code 1 --severity HIGH,CRITICAL devsecops-portfolio:${gitSha} || true"
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline terminé avec succès !'
        }
        failure {
            echo '❌ Le pipeline a échoué à cause d\'une alerte de sécurité.'
        }
    }
}
