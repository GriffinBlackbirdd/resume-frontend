#!/bin/bash

# Resume Builder Deployment Script
# This script helps deploy the application using Docker and Docker Compose

set -e  # Exit on any error

echo "🚀 Resume Builder Deployment Script"
echo "=================================="

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo "✅ Docker is installed"
}

# Function to check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo "✅ Docker Compose is available"
}

# Function to create necessary directories
create_directories() {
    echo "📁 Creating necessary directories..."
    mkdir -p uploads
    mkdir -p ssl
    echo "✅ Directories created"
}

# Function to build and start services
deploy() {
    echo "🏗️  Building and starting services..."

    # Stop any existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose down --remove-orphans || true

    # Build and start services
    echo "🔨 Building images..."
    docker-compose build --no-cache

    echo "🚀 Starting services..."
    docker-compose up -d

    echo "⏳ Waiting for services to be ready..."
    sleep 30

    # Check service health
    echo "🔍 Checking service health..."
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
        docker-compose logs backend
        exit 1
    fi

    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is responding"
    else
        echo "❌ Frontend health check failed"
        docker-compose logs frontend
        exit 1
    fi

    if curl -f http://localhost > /dev/null 2>&1; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx health check failed"
        docker-compose logs nginx
        exit 1
    fi
}

# Function to show deployment info
show_info() {
    echo ""
    echo "🎉 Deployment successful!"
    echo "========================"
    echo "📱 Application URLs:"
    echo "   • Main Application: http://localhost"
    echo "   • Frontend (direct): http://localhost:3000"
    echo "   • Backend API: http://localhost/api"
    echo "   • Backend (direct): http://localhost:8000"
    echo "   • API Documentation: http://localhost:8000/docs"
    echo "   • Health Check: http://localhost:8000/health"
    echo ""
    echo "🐳 Docker Commands:"
    echo "   • View logs: docker-compose logs -f [service_name]"
    echo "   • Stop services: docker-compose down"
    echo "   • Restart services: docker-compose restart"
    echo "   • View status: docker-compose ps"
    echo ""
    echo "📊 Monitoring:"
    echo "   • View all logs: docker-compose logs -f"
    echo "   • View backend logs: docker-compose logs -f backend"
    echo "   • View frontend logs: docker-compose logs -f frontend"
    echo "   • View nginx logs: docker-compose logs -f nginx"
}

# Main execution
main() {
    check_docker
    check_docker_compose
    create_directories
    deploy
    show_info
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ All services stopped"
        ;;
    "restart")
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "status")
        docker-compose ps
        ;;
    "clean")
        echo "🧹 Cleaning up Docker resources..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        echo "✅ Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the application (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - View logs (optional: specify service name)"
        echo "  status  - Show service status"
        echo "  clean   - Stop services and clean up Docker resources"
        exit 1
        ;;
esac