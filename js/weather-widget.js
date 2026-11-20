/**
 * 即時時間與天氣資訊組件 (Weather & Clock Widget)
 * 數據源：Open-Meteo 免費氣象 API (免 API Key、高可靠度、CORS 友好)
 */

const WMO_WEATHER_MAP = {
  0: { icon: '☀️', desc: '晴天' },
  1: { icon: '🌤️', desc: '晴朗' },
  2: { icon: '⛅', desc: '多雲' },
  3: { icon: '☁️', desc: '陰天' },
  45: { icon: '🌫️', desc: '有霧' },
  48: { icon: '🌫️', desc: '霧淞' },
  51: { icon: '🌧️', desc: '毛毛細雨' },
  53: { icon: '🌧️', desc: '小雨' },
  55: { icon: '🌧️', desc: '中雨' },
  61: { icon: '🌧️', desc: '陣雨' },
  63: { icon: '🌧️', desc: '中陣雨' },
  65: { icon: '🌧️', desc: '大陣雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '🌨️', desc: '中雪' },
  75: { icon: '🌨️', desc: '大雪' },
  80: { icon: '🌦️', desc: '短暫陣雨' },
  81: { icon: '🌦️', desc: '強陣雨' },
  82: { icon: '⛈️', desc: '暴雨' },
  95: { icon: '⛈️', desc: '雷陣雨' },
  96: { icon: '⛈️', desc: '雷雨伴有冰雹' },
  99: { icon: '⛈️', desc: '強烈雷雨冰雹' }
};

export class WeatherClockWidget {
  constructor() {
    this.container = document.getElementById('hubWeatherWidget');
    if (!this.container) return;

    this.lat = 25.033;
    this.lon = 121.565;
    this.locationName = '台北';

    this.init();
  }

  init() {
    this.renderSkeleton();
    this.startClock();
    this.initLocationAndWeather();
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="weather-clock-box">
        <!-- 第 1 排：即時時間 ｜ 日期星期 -->
        <div class="wc-row wc-row-border">
          <div class="wc-col wc-col-left">
            <span class="wc-clock-icon">⏰</span>
            <span class="wc-time-text" id="wcLiveTime">--:--:--</span>
          </div>
          <div class="wc-col wc-col-right">
            <span class="wc-date-text" id="wcLiveDate">--月--日</span>
            <span class="wc-day-text" id="wcLiveDay">星期-</span>
          </div>
        </div>

        <!-- 第 2 排：當前天氣 ｜ 今日高低溫 (氣候溫度組) -->
        <div class="wc-row wc-row-border">
          <div class="wc-col wc-col-left">
            <span class="wc-weather-icon" id="wcWeatherIcon">⛅</span>
            <span class="wc-weather-status" id="wcWeatherDesc">載入中</span>
            <span class="wc-temp-current" id="wcCurrentTemp">--°C</span>
          </div>
          <div class="wc-col wc-col-right">
            <span class="wc-metric-badge wc-badge-temp" id="wcTempRange">🌡️ 14°~19°C</span>
          </div>
        </div>

        <!-- 第 3 排：降雨機率 ｜ 日照區間 (環境天象組) -->
        <div class="wc-row">
          <div class="wc-col wc-col-left">
            <span class="wc-metric-badge wc-badge-precip" id="wcPrecip">🌧️ 降雨 --%</span>
          </div>
          <div class="wc-col wc-col-right wc-col-sun">
            <span class="wc-sun-icon">☀️</span>
            <span class="wc-sun-text" id="wcSunTimes">06:13 ~ 17:04</span>
          </div>
        </div>
      </div>
    `;
    this.domLiveTime = document.getElementById('wcLiveTime');
    this.domLiveDate = document.getElementById('wcLiveDate');
    this.domLiveDay = document.getElementById('wcLiveDay');

    this.domWeatherIcon = document.getElementById('wcWeatherIcon');
    this.domWeatherDesc = document.getElementById('wcWeatherDesc');
    this.domCurrentTemp = document.getElementById('wcCurrentTemp');
    this.domTempRange = document.getElementById('wcTempRange');
    this.domSunTimes = document.getElementById('wcSunTimes');
    this.domPrecip = document.getElementById('wcPrecip');
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const month = now.getMonth() + 1;
      const date = now.getDate();
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const dayName = days[now.getDay()];

      if (this.domLiveTime) this.domLiveTime.textContent = `${hours}:${minutes}:${seconds}`;
      if (this.domLiveDate) this.domLiveDate.textContent = `${month}月${date}日`;
      if (this.domLiveDay) this.domLiveDay.textContent = dayName;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  initLocationAndWeather() {
    const cached = this.getWeatherCache();
    if (cached) {
      this.applyWeatherData(cached);
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.lat = pos.coords.latitude;
          this.lon = pos.coords.longitude;
          this.fetchWeather();
        },
        () => {
          this.fetchWeather();
        },
        { timeout: 5000 }
      );
    } else {
      this.fetchWeather();
    }
  }

  async fetchWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      this.saveWeatherCache(data);
      this.applyWeatherData(data);
    } catch (e) {
      if (this.domWeatherDesc) {
        this.domWeatherDesc.textContent = '天氣讀取中';
      }
    }
  }

  applyWeatherData(data) {
    if (!data || !data.current || !data.daily) return;

    const curTemp = Math.round(data.current.temperature_2m);
    const curCode = data.current.weather_code;
    const weatherInfo = WMO_WEATHER_MAP[curCode] || { icon: '🌤️', desc: '晴朗' };

    const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
    const minTemp = Math.round(data.daily.temperature_2m_min[0]);

    const formatSunTime = (isoString) => {
      if (!isoString) return '--:--';
      const parts = isoString.split('T');
      return parts.length > 1 ? parts[1] : isoString;
    };
    const sunriseStr = formatSunTime(data.daily.sunrise[0]);
    const sunsetStr = formatSunTime(data.daily.sunset[0]);

    const precipProb = data.daily.precipitation_probability_max[0] ?? 0;

    if (this.domWeatherIcon) this.domWeatherIcon.textContent = weatherInfo.icon;
    if (this.domWeatherDesc) this.domWeatherDesc.textContent = weatherInfo.desc;
    if (this.domCurrentTemp) this.domCurrentTemp.textContent = `${curTemp}°C`;
    if (this.domTempRange) this.domTempRange.textContent = `🌡️ ${minTemp}°~${maxTemp}°C`;
    if (this.domSunTimes) this.domSunTimes.textContent = `${sunriseStr} ~ ${sunsetStr}`;
    if (this.domPrecip) this.domPrecip.textContent = `🌧️ 降雨 ${precipProb}%`;
  }

  saveWeatherCache(data) {
    try {
      const cacheObj = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem('dualbear_weather_cache_v1', JSON.stringify(cacheObj));
    } catch (e) {}
  }

  getWeatherCache() {
    try {
      const raw = localStorage.getItem('dualbear_weather_cache_v1');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.timestamp < 1800000) {
        return obj.data;
      }
    } catch (e) {}
    return null;
  }
}
