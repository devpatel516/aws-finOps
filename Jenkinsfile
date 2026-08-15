pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'finops'
    }

    stages {
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'backend-env-file', variable: 'BACKEND_ENV_FILE')]) {
                    sh '''
                        cp "$BACKEND_ENV_FILE" backend/.env
                        docker compose up -d --build --remove-orphans
                    '''
                }
            }
        }

        stage('Status') {
            steps {
                sh 'docker compose ps'
            }
        }
    }
}
