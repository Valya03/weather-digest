import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export class ReportStorage {
  constructor(reportsDir = "reports") {
    this.reportsDir = reportsDir;
  }

  // Формируем путь к файлу отчёта: reports/{город}-{ГГГГ-ММ-ДД}.json
  getReportPath(city, date = new Date()) {
    const dateStr = date.toISOString().slice(0, 10); // ГГГГ-ММ-ДД
    const safeCity = city.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_"); // убираем запрещённые символы
    return join(this.reportsDir, `${safeCity}-${dateStr}.json`);
  }

  // Сохраняем отчёт
  async save(city, data) {
    await mkdir(this.reportsDir, { recursive: true }); // создаём папку, если её нет
    const path = this.getReportPath(city);
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
    return path;
  }

  // Пытаемся прочитать отчёт из кэша
  async load(city) {
    const path = this.getReportPath(city);
    try {
      const content = await readFile(path, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") return null; // файла нет, значит кэш пуст
      throw error;
    }
  }
}
