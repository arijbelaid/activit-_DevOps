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

        // ⬇️ NOUVEAU STAGE SAST (Q65) ⬇️
        stage('Semgrep SAST') {
            steps {
                echo '🛡️ Analyse de sécurité statique (SAST) avec Semgrep...'
                sh '''
                    docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep:latest \
                    semgrep scan --config auto --error --exclude 'node_modules' --exclude '.next' --exclude 'dist'
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

        stage('API Tests') {
            steps {
                echo '🧪 Exécution des tests unitaires de l\'API...'
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
                echo '🏗️ Construction de l\'application Next.js...'
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
