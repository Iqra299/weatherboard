import { useEffect, useState } from 'react'
import './App.css'

const forecastDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function App() {
  const [dark, setDark] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inputError, setInputError] = useState('')
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [notifStatus, setNotifStatus] = useState('default')
  const [reminderTime, setReminderTime] = useState('08:00')

  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('weatherFavourites')) || [] } catch { return [] }
  })

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(console.error);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if ('Notification' in window) setNotifStatus(Notification.permission);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('weatherFavourites', JSON.stringify(favourites)) } catch (e) {}
  }, [favourites])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.length < 2) { setSuggestions([]); return }
      try {
        const res = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${searchInput}&limit=5`, {
          headers: { 'X-RapidAPI-Key': import.meta.env.VITE_GEODB_API_KEY, 'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com' }
        })
        const data = await res.json()
        if (data.data) setSuggestions(data.data)
      } catch (err) {}
    }
    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const handleSearch = async (cityName) => {
    if (!cityName || cityName.trim() === '') {
      setInputError("Please enter a city name.")
      return
    }
    setInputError("")
    setSearchInput(cityName)
    setShowSuggestions(false)
    setLoading(true)
    setError('')
    setWeatherData(null)
    setForecastData([])
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

    try {
      const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`)
      if (!currentRes.ok) throw new Error('City not found')
      const currentData = await currentRes.json()
      setWeatherData(currentData)

      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`)
      const forecastData = await forecastRes.json()
      setForecastData(forecastData.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addFavourite = () => {
    if (!weatherData) return
    if (favourites.length >= 5) return alert("Max 5 favourites allowed.")
    if (favourites.some(f => f.name === weatherData.name)) return alert("Already saved.")
    setFavourites([...favourites, { name: weatherData.name, country: weatherData.sys.country }])
  }

  const removeFavourite = (cityName) => {
    if (window.confirm(`Remove ${cityName}?`)) setFavourites(favourites.filter(f => f.name !== cityName))
  }

  const enableNotifications = async () => {
    if (!('Notification' in window)) return alert("Notifications not supported.");
    if (notifStatus === 'denied') return alert("You blocked notifications. Please reset in browser settings.");
    const permission = await Notification.requestPermission();
    setNotifStatus(permission);
    if (permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("WeatherBoard", {
          body: `Daily reminder set for ${reminderTime}.`,
          icon: "/vite.svg"
        });
      });
    }
  }

  // --- NEW: Dynamic Background Logic ---
  const getWeatherTheme = () => {
    if (!weatherData) return "from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10";
    const condition = weatherData.weather[0].main.toLowerCase();
    
    if (condition.includes('rain') || condition.includes('drizzle')) {
      return "from-blue-200 via-blue-100 to-gray-200 dark:from-blue-900/40 dark:via-blue-800/20 dark:to-gray-900";
    }
    if (condition.includes('thunderstorm')) {
      return "from-gray-400 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-900 dark:to-black";
    }
    if (condition.includes('snow')) {
      return "from-blue-50 via-white to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-blue-900";
    }
    if (condition.includes('clear')) {
      return "from-orange-100 via-yellow-50 to-blue-100 dark:from-orange-900/20 dark:via-yellow-900/10 dark:to-blue-900/20";
    }
    if (condition.includes('cloud')) {
      return "from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900";
    }
    return "from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10";
  };
    // --- NEW: Animated Background Logic ---
  const renderWeatherAnimation = () => {
    if (!weatherData) return null;
    const condition = weatherData.weather[0].main.toLowerCase();
    
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
      return <div className="weather-bg-container"><div className="rain"></div></div>;
    }
    if (condition.includes('cloud')) {
      return <div className="weather-bg-container"><div className="clouds"></div></div>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-200">
        {isOffline && (
          <div className="bg-red-500 text-white text-center text-xs py-1.5 font-medium tracking-wide shadow-sm sticky top-0 z-50">
            You are offline. Showing cached data.
          </div>
        )}
        
        <header className="sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-gray-800 to-black text-white shadow-lg shadow-black/20">
                <CloudIcon />
              </span>
              <span className="text-lg font-bold tracking-tight">WeatherBoard</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 shadow-sm">
                <span className="text-xs text-gray-500">Reminder:</span>
                <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="text-xs bg-transparent outline-none border-none font-semibold" />
                <button onClick={enableNotifications} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-gray-900 dark:bg-white text-white dark:text-black hover:opacity-80 transition">
                  {notifStatus === 'granted' ? 'Update' : 'Enable'}
                </button>
              </div>
              
              <button onClick={() => setDark(!dark)} className="grid size-10 place-items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm">
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <main className="flex min-w-0 flex-col gap-8">
            
            <div className="relative">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); handleSearch(searchInput) }}>
                <div className="flex-1 relative">
                  <input 
                    type="search" 
                    value={searchInput} 
                    onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); setInputError(''); }} 
                    onBlur={() => { if (searchInput.trim() === '') setInputError("City name is required."); }}
                    onFocus={() => setShowSuggestions(true)} 
                    placeholder="Search for a city..." 
                    className={`h-12 w-full rounded-xl border ${inputError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-gray-200 dark:border-gray-800 ring-0'} bg-white dark:bg-gray-900 px-5 text-sm font-medium shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all`} 
                  />
                  {inputError && <p className="absolute -bottom-5 text-xs text-red-500 font-medium">{inputError}</p>}
                </div>
                <button type="submit" disabled={loading} className="h-12 shrink-0 rounded-xl bg-gradient-to-b from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black px-6 text-sm font-semibold shadow-lg shadow-black/10 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-[1px] sm:mt-0">
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-14 z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2 shadow-2xl shadow-black/10 sm:w-[calc(100%-8rem)]">
                  {suggestions.map((city) => (
                    <li key={city.id}>
                      <button type="button" onClick={() => handleSearch(city.city)} className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="text-sm font-semibold">{city.city}</span>
                        <span className="text-xs text-gray-400 font-medium">{city.country}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 font-medium">{error}. Please try another city.</div>}

            {/* DYNAMIC WEATHER CARD */}
            <section className={`group relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xl shadow-black/5 transition-all duration-500 hover:shadow-2xl`}>
              {/* Dynamic Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getWeatherTheme()} opacity-80 dark:opacity-40 pointer-events-none transition-colors duration-1000`} />
              
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Current Weather</p>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{weatherData ? weatherData.name : 'City name'}</h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium capitalize">{weatherData ? weatherData.weather[0].description : 'Condition'}</p>
                  <p className="mt-6 flex items-start font-black">
                    <span className="text-6xl sm:text-7xl leading-none tracking-tighter">{weatherData ? Math.round(weatherData.main.temp) : '--'}</span>
                    <span className="mt-2 text-3xl text-gray-500 dark:text-gray-400">°C</span>
                  </p>
                </div>
                <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-sm">
                  {weatherData ? <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`} alt="icon" className="size-16 drop-shadow-lg" /> : <SunIcon className="size-10 text-gray-300" />}
                </div>
              </div>

              {weatherData && (
                <button onClick={addFavourite} className="absolute top-8 right-32 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md px-3 py-2 text-xs font-bold shadow-sm hover:bg-white/80 dark:hover:bg-black/60 transition active:scale-95 text-gray-800 dark:text-gray-200">
                  + Save City
                </button>
              )}

              <dl className="relative mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-sm px-5 py-4 border border-white/40 dark:border-gray-700/30">
                  <dt className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Humidity</dt>
                  <dd className="mt-1 text-lg font-bold">{weatherData ? `${weatherData.main.humidity}%` : '--%'}</dd>
                </div>
                <div className="rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-sm px-5 py-4 border border-white/40 dark:border-gray-700/30">
                  <dt className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wind speed</dt>
                  <dd className="mt-1 text-lg font-bold">{weatherData ? `${Math.round(weatherData.wind.speed * 3.6)} km/h` : '-- km/h'}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h2 className="text-lg font-bold tracking-tight mb-4">5-Day Forecast</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {forecastData.length > 0 ? forecastData.map((day, index) => (
                  <article key={index} className="flex min-w-[6rem] snap-start flex-1 flex-col items-center rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 px-4 py-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} alt="icon" className="my-3 size-10" />
                    <p className="text-base font-bold">{Math.round(day.main.temp)}°C</p>
                  </article>
                )) : forecastDays.map((day) => (
                  <article key={day} className="flex min-w-[6rem] flex-1 flex-col items-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-transparent px-4 py-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</p>
                    <span className="my-3 size-10 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-800" />
                    <p className="text-base font-bold text-gray-300 dark:text-gray-700">--°</p>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="rounded-3xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-6 shadow-xl shadow-black/5 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold tracking-tight">Favourite Cities</h2>
            <p className="mt-1 text-xs font-medium text-gray-400">Saved places ({favourites.length}/5)</p>
            <ul className="mt-5 flex flex-col gap-2">
              {favourites.length === 0 ? <p className="text-sm text-gray-400 italic py-4">No favourites saved yet.</p> : favourites.map((city) => (
                <li key={city.name} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                  <button type="button" onClick={() => handleSearch(city.name)} className="flex-1 text-left">
                    <span className="block text-sm font-bold">{city.name}</span>
                    <span className="block text-xs text-gray-500 font-medium">{city.country}</span>
                  </button>
                  <button onClick={() => removeFavourite(city.name)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md">✕</button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
    </div>
  )
}

function CloudIcon() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.6-1.5A3.5 3.5 0 0 0 7 18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>) }
function SunIcon({ className = 'size-5' }) { return (<svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>) }
function MoonIcon() { return (<svg className="size-5" viewBox="0 0 24 24" fill="none"><path d="M16.5 14.5A6.5 6.5 0 0 1 9 5.2 7 7 0 1 0 18.8 15a6.5 6.5 0 0 1-2.3-.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>) }

export default App