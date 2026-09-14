import { parseArgs } from "node:util";
import { ApiClient } from "./api/client.js";
import { WeatherService } from "./services/weatherService.js";
import { ReportStorage } from "./storage/reportStorage.js";
import { formatConsole } from "./format/consoleFormatter.js";

// 1. Читаем настройки из переменных окружения (с дефолтами)
const GEOCODING_URL =
  process.env.GEOCODING_BASE_URL ||
  "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL =
  process.env.FORECAST_BASE_URL || "https://api.open-meteo.com/v1/forecast";
const TIMEOUT = Number(process.env.REQUEST_TIMEOUT) || 5000;
const REPORTS_DIR = process.env.REPORTS_DIR || "reports";

// 2. Описываем, какие аргументы принимает утилита
const options = {
  city: { type: "string" },
  days: { type: "string", default: "3" },
  "no-cache": { type: "boolean", default: false },
};

async function main() {
  // 3. Разбираем аргументы
  let values;
  try {
    ({ values } = parseArgs({ options, allowPositionals: false }));
  } catch (err) {
    console.error(`Ошибка в аргументах: ${err.message}`);
    process.exit(1);
  }

  if (!values.city) {
    console.error(
      'Ошибка: параметр --city обязателен. Пример: node src/index.js --city "Москва" --days 3',
    );
    process.exit(1);
  }

  const days = Number(values.days);
  if (!Number.isInteger(days) || days < 1 || days > 7) {
    console.error("Ошибка: --days должен быть целым числом от 1 до 7.");
    process.exit(1);
  }

  const cities = values.city
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (cities.length === 0) {
    console.error("Ошибка: укажите хотя бы один город.");
    process.exit(1);
  }

  // 4. Создаём клиенты, сервис и хранилище
  const geocodingClient = new ApiClient(GEOCODING_URL, TIMEOUT);
  const forecastClient = new ApiClient(FORECAST_URL, TIMEOUT);
  const weatherService = new WeatherService(geocodingClient, forecastClient);
  const storage = new ReportStorage(REPORTS_DIR);

  const noCache = values["no-cache"];

  // 5. Обрабатываем каждый город
  for (const city of cities) {
    try {
      // 5.1. Проверяем кэш
      let weatherData = null;
      if (!noCache) {
        weatherData = await storage.load(city);
        if (weatherData) {
          console.log(`\n[кэш] Используем сохранённый отчёт для "${city}"`);
        }
      }

      // 5.2. Если в кэше нет - идём в сеть
      if (!weatherData) {
        weatherData = await weatherService.getWeatherForCity(city, days);
        const savedPath = await storage.save(city, weatherData);
        console.log(`\n[сеть] Отчёт сохранён: ${savedPath}`);
      }

      // 5.3. Печатаем таблицу
      formatConsole(weatherData);
    } catch (error) {
      // Ошибка по одному городу - не прерывает остальные
      console.error(`\nОшибка для города "${city}": ${error.message}`);
    }
  }
}

// 6. Запускаем и ловим все необработанные ошибки
main().catch((err) => {
  console.error(`Непредвиденная ошибка: ${err.message}`);
  process.exit(1);
});
