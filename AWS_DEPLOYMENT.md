# AWS Deployment Guide

## Overview

This document provides step-by-step instructions for deploying the Resume Builder application on AWS using Docker containers. The application consists of a Next.js frontend, a FastAPI backend, and an Nginx reverse proxy.

## Architecture

The deployment uses the following AWS services:
- EC2: Virtual server for hosting Docker containers
- ECR: Container registry for storing Docker images
- RDS: Managed PostgreSQL database (optional, as the app uses Supabase)
- S3: Object storage for file uploads (optional)
- Route 53: DNS management (optional)
- ACM: SSL certificate management (optional)

## Prerequisites

1. AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed locally
4. SSH key pair for EC2 access

## Step 1: Prepare the Application

### 1.1 Update Environment Variables

Create a production `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com
FASTAPI_URL=https://your-domain.com
```

### 1.2 Build Docker Images Locally

```bash
# Build all services
docker-compose build
```

## Step 2: Set up AWS ECR

### 2.1 Create ECR Repositories

```bash
# Create repository for backend
aws ecr create-repository --repository-name resume-builder-backend --region your-region

# Create repository for frontend
aws ecr create-repository --repository-name resume-builder-frontend --region your-region

# Create repository for nginx
aws ecr create-repository --repository-name resume-builder-nginx --region your-region
```

### 2.2 Authenticate Docker with ECR

```bash
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
```

### 2.3 Tag and Push Images

```bash
# Tag backend image
docker tag resume-frontend-backend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-backend:latest

# Tag frontend image
docker tag resume-frontend-frontend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-frontend:latest

# Tag nginx image
docker tag resume-frontend-nginx:latest your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-nginx:latest

# Push images
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-backend:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-frontend:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-nginx:latest
```

## Step 3: Launch EC2 Instance

### 3.1 Create Security Group

```bash
aws ec2 create-security-group --group-name resume-builder-sg --description "Security group for Resume Builder" --vpc-id your-vpc-id

# Add rules
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxx --protocol tcp --port 22 --cidr your-ip/32
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 3.2 Launch EC2 Instance

```bash
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --count 1 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxxx \
    --subnet-id subnet-xxxxxxx \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=resume-builder}]'
```

### 3.3 Install Docker on EC2

Connect to your EC2 instance and run:

```bash
# Update system
sudo yum update -y

# Install Docker
sudo amazon-linux-extras install docker

# Start Docker service
sudo service docker start

# Add ec2-user to docker group
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Step 4: Deploy Production Docker Compose

Create a `docker-compose.prod.yml` file on the EC2 instance:

```yaml
version: '3.8'

services:
  backend:
    image: your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-backend:latest
    container_name: resume_backend
    environment:
      - PYTHONPATH=/app
    volumes:
      - uploads_data:/app/uploads
    restart: unless-stopped
    networks:
      - resume_network

  frontend:
    image: your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-frontend:latest
    container_name: resume_frontend
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://your-domain.com
      - FASTAPI_URL=https://your-domain.com
      - NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
      - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - resume_network

  nginx:
    image: your-account-id.dkr.ecr.your-region.amazonaws.com/resume-builder-nginx:latest
    container_name: resume_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs:ro
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - resume_network

networks:
  resume_network:
    driver: bridge

volumes:
  uploads_data:
```

## Step 5: Configure Nginx

Create `nginx.prod.conf` for production:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL configuration
        ssl_certificate /etc/ssl/certs/cert.pem;
        ssl_certificate_key /etc/ssl/certs/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## Step 6: Set up SSL Certificate

### 6.1 Using AWS ACM

```bash
# Request certificate
aws acm request-certificate --domain-name your-domain.com --subject-alternative-names www.your-domain.com --validation-method DNS

# After DNS validation, export certificate
aws acm export-certificate --certificate-arn arn:aws:acm:region:account-id:certificate/certificate-id --passphrase password
```

### 6.2 Or Use Let's Encrypt

```bash
# Install Certbot
sudo wget -r --no-parent -A 'epel-release-*.rpm' http://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/
sudo rpm -Uvh dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/epel-release-*.rpm
sudo yum-config-manager --enable epel
sudo yum install certbot -y

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to SSL directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /home/ec2-user/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /home/ec2-user/ssl/key.pem
```

## Step 7: Start the Application

```bash
# Create necessary directories
mkdir -p ssl

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## Step 8: Set up Monitoring

### 8.1 CloudWatch Monitoring

Create IAM role for CloudWatch:
```bash
aws iam create-role --role-name EC2-CloudWatch-Role --assume-role-policy-document '{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]}'

aws iam attach-role-policy --role-name EC2-CloudWatch-Role --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

aws iam create-instance-profile --instance-profile-name CloudWatch-Agent-Profile

aws iam add-role-to-instance-profile --instance-profile-name CloudWatch-Agent-Profile --role-name EC2-CloudWatch-Role
```

### 8.2 Install CloudWatch Agent

On the EC2 instance:
```bash
sudo yum install https://s3.amazonaws.com/amazoncloudwatch-agent-amazonlinux/amd64/latest/amazon-cloudwatch-agent.rpm -y

# Create CloudWatch configuration
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null <<EOL
{
  "agent": {
    "metrics_collection_interval": 60
  },
  "metrics": {
    "append_dimensions": {
      "InstanceId": "${aws:InstanceId}"
    },
    "metrics_collected": {
      "mem": {
        "measurement": ["mem_used_percent"]
      },
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait"]
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "resources": ["/"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/docker",
            "log_group_name": "docker-logs",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOL

# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
```

## Step 9: Set up Auto Scaling (Optional)

### 9.1 Create Launch Template

```bash
aws ec2 create-launch-template --launch-template-name resume-builder-template --launch-template-data '{"ImageId": "ami-xxxxxxx", "InstanceType": "t3.medium", "SecurityGroupIds": ["sg-xxxxxxx"], "IamInstanceProfile": {"Name": "CloudWatch-Agent-Profile"}}'
```

### 9.2 Create Auto Scaling Group

```bash
aws autoscaling create-auto-scaling-group --auto-scaling-group-name resume-builder-asg --launch-template LaunchTemplateId=lt-xxxxxxx --min-size 2 --max-size 5 --desired-capacity 2 --vpc-zone-identifier "subnet-xxxxxxx,subnet-yyyyyyy" --target-group-arns arn:aws:elasticloadbalancing:region:account-id:targetgroup/resume-builder-tg/xxxxxxx
```

## Step 10: Backup and Recovery

### 10.1 Create AMI Backup

```bash
aws ec2 create-image --instance-id i-xxxxxxx --name "resume-builder-backup-$(date +%Y%m%d)" --description "Backup of Resume Builder application"
```

### 10.2 Set up Automated Backups

```bash
aws ec2 create-snapshot --volume-id vol-xxxxxxx --description "Automated backup"
```

## Maintenance

### Updating the Application

1. Build and push new images to ECR
2. Pull new images on EC2:
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   ```
3. Restart services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Monitoring Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Security Considerations

1. Regularly update base Docker images
2. Rotate secrets and passwords regularly
3. Implement WAF (Web Application Firewall)
4. Enable VPC Flow Logs
5. Use security groups to restrict access
6. Enable AWS Shield for DDoS protection

### Cost Optimization

1. Use Reserved Instances for long-running workloads
2. Set up CloudWatch alarms for billing
3. Use Spot Instances for non-critical components
4. Enable S3 lifecycle policies
5. Monitor and right-size EC2 instances

## Troubleshooting

### Common Issues

1. **Container not starting**: Check logs with `docker-compose logs`
2. **502 Bad Gateway**: Verify upstream services are running
3. **SSL certificate errors**: Ensure certificates are valid and paths are correct
4. **Database connection issues**: Check security group rules and database credentials

### Health Checks

```bash
# Backend health
curl https://your-domain.com/health

# Frontend accessibility
curl -I https://your-domain.com
```

## Support

For technical support:
1. Check CloudWatch logs
2. Review EC2 instance status
3. Verify security group configurations
4. Check Docker container logs
5. Monitor resource utilization

## Appendix

### Useful AWS CLI Commands

```bash
# List EC2 instances
aws ec2 describe-instances

# List ECR repositories
aws ecr describe-repositories

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=InstanceId,Value=i-xxxxxxx --start-time 2023-01-01T00:00:00 --end-time 2023-01-02T00:00:00 --period 3600 --statistics Average
```