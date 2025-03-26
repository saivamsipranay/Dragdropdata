pipeline {
    agent any

    environment {
        IMAGE_NAME = "React-App"
        //IMAGE_TAG = "2.0"
        DOCKER_HUB_USER = "saivamsipranay"
    }

    stages {
        stage('Checkout Code') {
            steps {
                sh 'echo "git checkout"'
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh 'npx npm-check-updates -u && npm install'
                }
            }
        }

        stage('Build React App') {
            steps {
                script {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME}:${BUILD_ID} ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'DockerHub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo '${DOCKER_PASS}' | docker login -u '${DOCKER_USER}' --password-stdin"
                        sh "docker tag ${IMAGE_NAME}:${BUILD_ID} ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_ID}"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_ID}"
                    }
                }    
            }
        }
    }
}



