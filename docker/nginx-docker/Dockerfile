FROM nginx:stable-alpine

ENV DIRPATH=/etc/nginx

WORKDIR ${DIRPATH}

COPY ./nginx.conf ./nginx.conf

ADD ./sites-enabled ./sites-enabled/
RUN ls -shail /etc/nginx/sites-enabled/

RUN mkdir -p /var/log/nginx