# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog][keepachangelog] and this project adheres to [Semantic Versioning][semver].

## UNRELEASED

### Fixed

- Fail the action if an error occurs, instead of just logging the error message [#7]

### Added

- Environment variables interpolation in `run` and `post` commands [#7]
- Possibility to determine the shell to use for `run` and `post` commands [#7]
- Possibility to write the multiline commands using \ separator [#7]

[#7]:https://github.com/gacts/run-and-post-run/pull/7

## v1.1.0

### Added

- `run` and `post` parameters now can be a list of commands

### Changed

- `post` parameter is required now
- `post` command will run even if workflow has errors

### Fixed

- Removed stacktrace from error

## v1.0.0

### Added

- First action release

[keepachangelog]:https://keepachangelog.com/en/1.0.0/
[semver]:https://semver.org/spec/v2.0.0.html
