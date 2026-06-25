FROM postgres:16-alpine

# Environment variables
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres123
ENV POSTGRES_DB=node_app

# Copy initialization scripts (optional)
COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432