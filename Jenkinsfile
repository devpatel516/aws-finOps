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
            // Fix ownership of the directory before copying
            sh 'sudo chown -R jenkins:jenkins backend/' 
            
            // Your original setup commands
            sh 'cp $BACKEND_ENV_FILE backend/.env'
            sh 'docker compose up -d --build --remove-orphans'
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
