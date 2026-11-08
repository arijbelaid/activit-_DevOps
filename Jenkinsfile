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

        // ⬇️ NOUVEAU STAGE POUR LA Q62 ⬇️
        stage('Build Docker Images') {
            steps {
                echo '🐳 Construction des images Docker...'
                sh 'docker build -t devsecops-api ./api'
                sh 'docker build -t devsecops-portfolio ./nextjs-portfolio'
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
