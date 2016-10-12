class Profiler {
  constructor() {
    this.profile = {}
  }

  start(name) {
    this.profile[name] = this.profile[name] || {count: 0, elapsed: 0}
    this.profile[name].start = Date.now()
  }

  pause(name) {
    const now = Date.now()
    this.profile[name].count++
    this.profile[name].elapsed += now - this.profile[name].start
  }

  reset() {
    this.profile = {}
  }

  report() {
    Object.keys(this.profile).forEach(name => {
      this.profile[name].avg = this.profile[name].elapsed / this.profile[name].count
    })
    console.log(JSON.stringify(this.profile, null, 4))
  }
}

export default new Profiler()
