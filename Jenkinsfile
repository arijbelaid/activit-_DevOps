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

        // ⬇️ NOUVEAU STAGE SÉCURITÉ (Q64) ⬇️
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
                    // Archive le rapport JSON pour pouvoir le consulter depuis Jenkins
                    archiveArtifacts artifacts: 'gitleaks.json', allowEmptyArchive: true
                }
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
                    // On récupère le SHA court (ex: a1b2c3d)
                    def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "🐳 Construction des images Docker avec le tag : ${gitSha}"
                    
                    // Construction avec le tag SHA
                    sh "docker build -t devsecops-api:${gitSha} ./api"
                    sh "docker build -t devsecops-portfolio:${gitSha} ./nextjs-portfolio"
                    
                    // On met aussi à jour le tag 'latest' pour le déploiement local
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
