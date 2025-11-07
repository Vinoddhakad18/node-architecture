FROM mysql:8.0

# Set default character set and collation
ENV MYSQL_CHARACTER_SET_SERVER=utf8mb4
ENV MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci

# Copy custom MySQL configuration if needed
COPY my.cnf /etc/mysql/conf.d/my.cnf

# Copy initialization scripts
COPY init/ /docker-entrypoint-initdb.d/

# Expose MySQL port
EXPOSE 3306

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD || exit 1
