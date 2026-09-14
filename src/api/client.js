export class ApiClient {
  constructor(baseUrl, timeout = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async get(path = "", params = {}) {
    // 1. Собираем URL безопасным способом
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // 2. Настраиваем таймаут (ограничение времени ожидания)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // 3. Делаем запрос через встроенный fetch
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId); // Отключаем таймер, если ответ пришёл быстро

      // 4. Проверяем статус ответа
      if (response.status >= 400 && response.status < 500) {
        throw new Error(
          `Ошибка клиента (${response.status}): проверьте параметры запроса.`,
        );
      }
      if (response.status >= 500) {
        throw new Error(
          `Ошибка сервера (${response.status}): попробуйте позже.`,
        );
      }
      if (!response.ok) {
        throw new Error(`Неожиданный статус ответа: ${response.status}`);
      }

      // 5. Возвращаем JSON
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Обработка таймаута
      if (error.name === "AbortError") {
        throw new Error(
          `Превышено время ожидания ответа (${this.timeout} мс).`,
        );
      }

      // Обработка отсутствия сети
      if (
        error instanceof TypeError &&
        error.message.includes("fetch failed")
      ) {
        throw new Error("Нет соединения с сетью. Проверьте интернет.");
      }

      // Пробрасываем другие ошибки дальше
      throw error;
    }
  }
}
