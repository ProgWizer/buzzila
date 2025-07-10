@echo off
setlocal

:: Проверяем наличие Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python не установлен. Пожалуйста, установите Python.
    exit /b 1
)

:: Проверяем наличие pip
where pip >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo pip не установлен. Пожалуйста, установите pip.
    exit /b 1
)

:: Создаем виртуальное окружение, если его нет
if not exist venv (
    echo Создаем виртуальное окружение...
    python -m venv venv
)

:: Активируем виртуальное окружение
call venv\Scripts\activate.bat

:: Устанавливаем зависимости
echo Устанавливаем зависимости...
pip install -r requirements.txt

:: Проверяем наличие .env файла
if not exist .env (
    echo Файл .env не найден. Создайте его на основе .env.example
    exit /b 1
)

:: Запускаем инициализацию базы данных
echo Запускаем инициализацию базы данных...
python -m backend.database.init_db

:: Проверяем результат
if %ERRORLEVEL% equ 0 (
    echo Инициализация базы данных успешно завершена!
) else (
    echo Ошибка при инициализации базы данных.
    exit /b 1
)

:: Деактивируем виртуальное окружение
call venv\Scripts\deactivate.bat

endlocal 