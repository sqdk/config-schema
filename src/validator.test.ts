import { Validator, ValidatorOptions, MissingValueError, ValueMismatchError } from './validator'
import { PassthroughReader } from './config_sources/passthrough';

import test from 'ava'
import { JsonReader } from './config_sources/json';

test('Validator should detect a missing key in the next environment at the first level', async (t) => {
    const current = { a: "a", 1: 1, x: "x" }
    const next = { a: "a", 1: 1}
    const currentReader = new JsonReader(current)
    const nextReader = new JsonReader(next)
    const validator = new Validator(currentReader, nextReader, new ValidatorOptions())

    const errors = await validator.validate()
    t.is(errors.length, 2)
    t.true(errors.some((err) => err instanceof MissingValueError))
    t.true(errors.some((err) => err instanceof ValueMismatchError))
    t.is(errors.every((err) => err.location == "x"), true)
});

test('Validator should detect a missing key in the next environment at the second level', async (t) => {
    const current = { a: "a", 1: 1, x: { y: "y", z: "z" } }
    const next = { a: "a", 1: 1, x: { y: "y" } }
    const currentReader = new JsonReader(current)
    const nextReader = new JsonReader(next)
    const validator = new Validator(currentReader, nextReader, new ValidatorOptions())

    const errors = await validator.validate()
    t.is(errors.length, 2)
    t.is(errors.length, 2)
    t.true(errors.some((err) => err instanceof MissingValueError))
    t.true(errors.some((err) => err instanceof ValueMismatchError))
    t.is(errors.every((err) => err.location == "x.z"), true)
});

test('Validator should not detect a missing key in the next environment at the second level if it is whitelisted', async (t) => {
    const current = { a: "a", 1: 1, x: { y: "y", z: "z" } }
    const next = { a: "a", 1: 1, x: { y: "y" } }
    const currentReader = new JsonReader(current)
    const nextReader = new JsonReader(next)
    const validator = new Validator(currentReader, nextReader, new ValidatorOptions([new RegExp('x.z')]))

    const errors = await validator.validate()
    t.is(errors.length, 0)
});

test('Validator should detect key with different values', async (t) => {
    const current = { a: "a", 1: 1, x: { y: "y" } }
    const next = { a: "a", 1: 1, x: { y: "z" } }
    const currentReader = new JsonReader(current)
    const nextReader = new JsonReader(next)
    const validator = new Validator(currentReader, nextReader, new ValidatorOptions())

    const errors = await validator.validate()
    t.is(errors.length, 1)
    t.true(errors[0] instanceof ValueMismatchError)
    t.is(errors[0].location, "x.y")
})

test('Validator sohuld not detect key with different value if its whitelisted with a static filter', async (t) => {
    const current = { a: "a", 1: 1, x: { y: "y" } }
    const next = { a: "a", 1: 1, x: { y: "z" } }
    const currentReader = new JsonReader(current)
    const nextReader = new JsonReader(next)
    const validator = new Validator(currentReader, nextReader, new ValidatorOptions([new RegExp('x.y')]))

    const errors = await validator.validate()
    t.is(errors.length, 0)
})

test('Validator sohuld not detect key with different value if its whitelisted by a regex', async (t) => {
    const current = { a: "a", 1: 1, x: { y: "y" } }
    const next = { a: "a", 1: 1, x: { y: "z" } }
    const currentReader = new JsonReader(current)
    const nextReader = new JsonReader(next)
    const validator = new Validator(currentReader, nextReader, new ValidatorOptions([/x.\w/]))

    const errors = await validator.validate()
    t.is(errors.length, 0)
})