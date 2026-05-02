# Clinic Ops Commands

Quick Docker operations for the clinic deployment stacks.

## Deploy

```bash
docker compose -f docker-compose.booking.prod.yaml up -d --build
docker compose -f docker-compose.blog.prod.yaml up -d --build
docker compose -f docker-compose.chatbot.prod.yaml up -d --build
docker compose -f docker-compose.frontend.prod.yaml up -d --build
docker compose -f docker-compose.admin.yml up -d --build
```

## Connect Admin To Data Networks

The admin stack has its own private network. After deploy, connect the admin
backend container to the booking and blog backend networks so it can reach
`booking-db` and `blog-db`.

```bash
docker network connect clinic_clinic-booking-backend clinic-admin-backend
docker network connect clinic_clinic-blog-backend clinic-admin-backend
docker restart clinic-admin-backend
```

If either command says the endpoint already exists, that connection is already
in place. Restart the admin backend after connecting the networks so its DB
connections are recreated on the newly attached networks.

Check the connections:

```bash
docker inspect clinic-admin-backend --format '{{json .NetworkSettings.Networks}}'
```

## Take Down

```bash
docker compose -f docker-compose.admin.yml down
docker compose -f docker-compose.frontend.prod.yaml down
docker compose -f docker-compose.chatbot.prod.yaml down
docker compose -f docker-compose.blog.prod.yaml down
docker compose -f docker-compose.booking.prod.yaml down
```

## Take Down And Delete Volumes

DANGER!: this deletes the Postgres data volumes for booking and blog. Use only
when you intentionally want to wipe persisted database data.

```bash
docker compose -f docker-compose.admin.yml down -v
docker compose -f docker-compose.frontend.prod.yaml down -v
docker compose -f docker-compose.chatbot.prod.yaml down -v
docker compose -f docker-compose.blog.prod.yaml down -v
docker compose -f docker-compose.booking.prod.yaml down -v
```

Note: booking/blog Postgres volumes are configured as external volumes
(`clinic_booking_postgres_data`, `clinic_blog_postgres_data`).
`down -v` will not remove external volumes.

## One-Time Volume Bootstrap

Create the protected external volumes once before first deploy:

```bash
docker volume create clinic_booking_postgres_data
docker volume create clinic_blog_postgres_data
```

## Useful Checks

```bash
docker compose -f docker-compose.booking.prod.yaml ps
docker compose -f docker-compose.blog.prod.yaml ps
docker compose -f docker-compose.chatbot.prod.yaml ps
docker compose -f docker-compose.frontend.prod.yaml ps
docker compose -f docker-compose.admin.yml ps
```

## Logs

```bash
docker compose -f docker-compose.booking.prod.yaml logs -f --tail 100
docker compose -f docker-compose.blog.prod.yaml logs -f --tail 100
docker compose -f docker-compose.chatbot.prod.yaml logs -f --tail 100
docker compose -f docker-compose.frontend.prod.yaml logs -f --tail 100
docker compose -f docker-compose.admin.yml logs -f --tail 100
```

Individual containers:

```bash
docker logs clinic-booking-backend -f --tail 100
docker logs clinic-booking-db -f --tail 100
docker logs clinic-blog-backend -f --tail 100
docker logs clinic-blog-db -f --tail 100
docker logs clinic-chatbot-backend -f --tail 100
docker logs clinic-frontend -f --tail 100
docker logs clinic-adminpage -f --tail 100
docker logs clinic-admin-backend -f --tail 100
```
