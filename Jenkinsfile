pipeline {
  agent any

  environment {
    SERVER_HOST = "192.168.1.165"
    SERVER_USER = "kevinsiraki"
    SERVER_PATH = "/var/www/testsite/analytics"     // <-- folder you specify
    BUILD_DIR   = "dist"               // Vite = dist
    SSH_CRED_ID = "bec2893a-7654-400a-b89f-83c918fc5997"
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      steps { sh 'npm ci' }
    }

    stage('Build') {
      steps {
        sh '''
          npm run build
          test -d "${BUILD_DIR}"
        '''
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ["${SSH_CRED_ID}"]) {
          sh '''
            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "mkdir -p '${SERVER_PATH}'"

            rsync -az --delete -e "ssh -o StrictHostKeyChecking=no" \
              "${BUILD_DIR}/" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
          '''
        }
      }
    }
  }
}