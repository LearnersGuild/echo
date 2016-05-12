import test from 'ava'

/*
 * Spec  - An abstract class representing a test
 */
export default class Spec {

  static run(state = {}) {
    const spec = new this(state)
    spec.run()
  }

  constructor(state = {}) {
    this.state = state
  }

  run() {
    return test.serial(this.testName(), async t => {
      await this.given(t)
      this.result = await this.when(t)
      await this.expect(t)
    })
  }

  testName() {
    return this.constructor.name
  }

  given() { /* override in subclass to create the state for the test */ }
  when() { /* override in subclass to preform the action being tested */ }
  expect() { /* override in subclass to make assertions on the resulting state */ }
}
