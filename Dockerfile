FROM node:alpine as build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build --prod

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /usr/src/app/dist/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]