# Этап сборки
FROM node:18-alpine AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install 
RUN npm install react-toastify 
RUN npm install react-icons 
RUN npm install chart.js react-chartjs-2 --save 

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап production
FROM nginx:alpine

# Копируем конфигурацию Nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем собранное приложение
COPY --from=build /app/build /usr/share/nginx/html

# Устанавливаем правильные права доступа
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Запускаем Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]