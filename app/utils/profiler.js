class Profiler {
  constructor() {
    this.start = new Date().valueOf();
    this.snapshots = {};
    this.results = [];
  }

  elapsed() {
    return new Date().valueOf() - this.start;
  }

  snapshot(key) {
    this.snapshots[key] = new Date().valueOf();
  }

  capture(key) {
    this.results.push(`${key}:${new Date().valueOf() - this.snapshots[key]}ms`);
    delete this.snapshots[key];
  }

  async measure(key, fn) {
    this.snapshot(key);
    const r = await fn();
    this.capture(key);
    return r;
  }

  summary() {
    return `t:${this.elapsed()}ms > ${this.results.join(' > ')}`;
  }
}

module.exports = Profiler;
