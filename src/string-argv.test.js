import { describe, expect, it } from '@jest/globals'
import parse from './string-argv'

describe('parse string to argv', () => {
  function parseAndValidate(give, want) {
    expect(parse(give)).toStrictEqual(want)
  }

  it.each([
    ['an arguments array correctly without file and env', '-test', ['-test']],
    ['a single key', '-test', ['-test']],
    ['a single key with a value', '-test testing', ['-test', 'testing']],
    ['a single key=value', '-test=testing', ['-test=testing']],
    ['a single value with quotes', '"test quotes"', ['test quotes']],
    ['a single value with empty quotes', '""', ['']],
    [
      'a complex string with quotes',
      '-testing test -valid=true --quotes "test quotes"',
      ['-testing', 'test', '-valid=true', '--quotes', 'test quotes'],
    ],
    [
      'a complex string with empty quotes',
      '-testing test -valid=true --quotes ""',
      ['-testing', 'test', '-valid=true', '--quotes', ''],
    ],
    [
      'a complex string with nested quotes',
      '--title "Peter\'s Friends" --name \'Phil "The Power" Taylor\'',
      ['--title', "Peter's Friends", '--name', 'Phil "The Power" Taylor'],
    ],
    [
      'a complex key value with quotes',
      "--name='Phil Taylor' --title=\"Peter's Friends\"",
      ["--name='Phil Taylor'", '--title="Peter\'s Friends"'],
    ],
    [
      'a complex key value with nested quotes',
      '--name=\'Phil "The Power" Taylor\'',
      ['--name=\'Phil "The Power" Taylor\''],
    ],
    [
      'nested quotes with no spaces',
      'jake run:silent["echo 1"] --trace',
      ['jake', 'run:silent["echo 1"]', '--trace'],
    ],
    [
      'multiple nested quotes with no spaces',
      'jake run:silent["echo 1"]["echo 2"] --trace',
      ['jake', 'run:silent["echo 1"]["echo 2"]', '--trace'],
    ],
    [
      'complex multiple nested quotes',
      'cli value("echo")[\'grep\']+"Peter\'s Friends"',
      ['cli', 'value("echo")[\'grep\']+"Peter\'s Friends"'],
    ],
  ])(`%s`, (_, give, want) => {
    expect(parse(give)).toStrictEqual(want)
  })
})
