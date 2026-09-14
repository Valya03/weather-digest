export class WeatherService {
  constructor(geocodingClient, forecastClient) {
    this.geocodingClient = geocodingClient;
    this.forecastClient = forecastClient;
  }

  // Шаг 1: Получаем координаты города
  async getCoordinates(city) {
    const data = await this.geocodingClient.get("", {
      name: city,
      count: 1,
      language: "ru",
      format: "json",
    });

    // Если API вернул пустой список, значит, город не найден
    if (!data.results || data.results.length === 0) {
      throw new Error(`Город "${city}" не найден. Проверьте название.`);
    }

    const { latitude, longitude, name, country } = data.results[0];
    return { latitude, longitude, name, country };
  }

  // Шаг 2: Получаем прогноз по координатам
  async getForecast(latitude, longitude, days) {
    const data = await this.forecastClient.get("", {
      latitude,
      longitude,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      forecast_days: days,
      timezone: "auto",
    });

    return data.daily;
  }

  // Шаг 3: Связываем два запроса в один сценарий
  async getWeatherForCity(city, days) {
    const coords = await this.getCoordinates(city);
    const forecast = await this.getForecast(
      coords.latitude,
      coords.longitude,
      days,
    );

    // Возвращаем всё вместе
    return { ...coords, forecast };
  }
}
