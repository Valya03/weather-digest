export function formatConsole(weatherData) {
  const { name, country, latitude, longitude, forecast } = weatherData;

  console.log(`\n ${name}, ${country}`);
  console.log(`Координаты: ${latitude}, ${longitude}`);
  console.log("─".repeat(58));
  console.log("Дата       | Мин. °C | Макс. °C | Осадки (мм)");
  console.log("─".repeat(58));

  for (let i = 0; i < forecast.time.length; i++) {
    const date = forecast.time[i];
    const min = forecast.temperature_2m_min[i];
    const max = forecast.temperature_2m_max[i];
    const precip = forecast.precipitation_sum[i];
    console.log(
      `${date} | ${String(min).padStart(7)} | ${String(max).padStart(8)} | ${String(precip).padStart(11)}`,
    );
  }
  console.log("─".repeat(58));
}
