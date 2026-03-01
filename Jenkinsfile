pipeline {
  agent {
    docker {
      image 'node:latest'
      args '-u root:root'
    }
  }

  environment {
    SERVER_HOST = '192.168.1.165'
    SERVER_USER = 'kevinsiraki'
    SERVER_PATH = '/var/www/testsite/analytics'
    BUILD_DIR   = 'dist'
    SSH_CRED_ID = 'bec2893a-7654-400a-b89f-83c918fc5997'
  }

  options { timestamps() }

  stages {
    stage('Install System Tools') {
      steps {
        sh '''
          apt-get update
          apt-get install -y rsync openssh-client
        '''
      }
  }

    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      steps { sh 'npm ci' }
    }

    stage('Build and Test') {
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

  post {
    success {
      withCredentials([
      string(credentialsId: 'discord-webhook-url', variable: 'DISCORD_URL'),
      string(credentialsId: 'discord-api-key', variable: 'DISCORD_KEY')
    ]) {
        sh '''
        curl -s -X POST http://192.168.1.86/CommonServices/discord \
        -H "Content-Type: application/json" \
        --data @- <<EOF
{
  "url": "$DISCORD_URL",
  "key": "$DISCORD_KEY",
  "content": "✅ $JOB_NAME #$BUILD_NUMBER deployed successfully to $SERVER_PATH"
}
EOF
      '''
    }
    }

    failure {
      withCredentials([
      string(credentialsId: 'discord-webhook-url', variable: 'DISCORD_URL'),
      string(credentialsId: 'discord-api-key', variable: 'DISCORD_KEY')
    ]) {
        sh '''
        curl -s -X POST http://192.168.1.86/CommonServices/discord \
        -H "Content-Type: application/json" \
        --data @- <<EOF
{
  "url": "$DISCORD_URL",
  "key": "$DISCORD_KEY",
  "content": "❌ $JOB_NAME #$BUILD_NUMBER FAILED. Check Jenkins logs."
}
EOF
      '''
    }
    }
  }
}
