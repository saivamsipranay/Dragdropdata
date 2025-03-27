pipeline {
    agent any

    environment {
        IMAGE_NAME = "react-app"
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
                    sh 'npm install'
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
        stage('Deploy to GKE') {
            steps {
                script {
                    // Authenticate to GKE
                    sh 'gcloud container clusters get-credentials autopilot-cluster-1 --region us-central1 --project tidal-repeater-454806-d1'

                    // Apply Kubernetes Deployment
                    sh """
                    kubectl set image deployment/react-app-deployment \
                    react-app=saivamsipranay/react-app:${BUILD_ID}
                    """
                }
            }
        }
        stage('Sleep') {
            steps {
                sh 'sleep 30'
            }
        }
    }
    post {
    success {
        archiveArtifacts artifacts: 'build/**', fingerprint: true
    }
}
}



