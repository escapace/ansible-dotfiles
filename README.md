# ansible-dotfiles

Configures a user with Fish, dotfiles, and a released Neovim configuration on
RHEL-family systems. The user receives passwordless sudo. Dotfiles install offline
by default; Neovim dependencies come from a checksum-verified release archive.
The role does not start services.

## Variables

- `dotfiles_username` is required and names the user created under `/home`.
- `dotfiles_key` defaults to `null`. A nonempty SSH public key is added to the
  user's authorized keys; unset, `null`, and empty values leave keys unchanged.
- `dotfiles_keyboard_interactive_group` defaults to `null`. A nonempty value
  creates a supplementary group and adds the user; unset, `null`, and empty values
  disable this operation.
- `dotfiles_online_install` defaults to `false`. The installer configures the user
  and reuses existing tools without downloading missing tools or cloning
  context-engineering. Missing tools produce warnings, not failures. Set it to
  `true` to acquire tools online; upstream availability and GitHub API rate limits
  can then fail installation.
- `dotfiles_vim_online_install` defaults to `false`. The role downloads prepared
  dependencies and runs `manage install --offline`. Set it to `true` to acquire
  and build dependencies through the upstream installer instead. Both values
  install the Neovim configuration; neither skips it.
- `dotfiles_vim_version` defaults to `latest`, resolved to GitHub's latest stable
  release on each run. An exact SemVer release, such as `v0.1.0` or `0.1.0`, pins
  the matching checkout and dependencies. Explicit prereleases are accepted.
- `dotfiles_kubectl_install` and `dotfiles_virtctl_install` default to `false`.
  Enable either to install and update that client in the user's `~/.local/bin` on
  Linux `x86_64` or `aarch64`. Disabling leaves existing installations unchanged.
- `dotfiles_kubectl_version` and `dotfiles_virtctl_version` default to `latest`.
  Enabled clients resolve the latest stable upstream release once per invocation.
  Use an exact SemVer version, with or without `v`, to pin a release.
- `dotfiles_git_depth` defaults to `1`; use a nonnegative integer, with `0` for
  full history.
- `dotfiles_repo` defaults to `https://github.com/yyxi/dotfiles.git`;
  `dotfiles_version` defaults to `whitelabel`. These select the initial checkout;
  the role does not update existing dotfiles checkouts.
- `dotfiles_directory` defaults to `/home/{{ dotfiles_username }}/.dotfiles`.
  Upstream home configuration expects this canonical location.
- `dotfiles_vim_repo` defaults to `https://github.com/yyxi/vim.git`. Overrides
  require a GitHub HTTPS `.git` URL publishing compatible SemVer releases and
  prepared archives with SHA-256 asset digests.
- `dotfiles_vim_directory` defaults to `/home/{{ dotfiles_username }}/.vim` and
  requires an absolute path. The role owns generated dependencies there and
  replaces them when the release or repository changes.
- `dotfiles_tmp_directory` defaults to `/home/{{ dotfiles_username }}/.tmp`.
  The role removes this directory, including any existing contents.
- `dotfiles_nodenv_install` defaults to `false`. Enabling it installs and updates
  nodenv and node-build, installs the selected Node.js runtime, and selects it as
  the user's global nodenv default. Disabled installations perform no nodenv or
  Node.js release lookups.
- `dotfiles_node_version` defaults to `lts`, the newest LTS release in Node.js's
  release index. An exact stable version, such as `24.22.1` or `v24.22.1`, pins the
  runtime. This variable applies only when `dotfiles_nodenv_install` is `true`.
- `dotfiles_nodenv_directory` defaults to `/home/{{ dotfiles_username }}/.nodenv`;
  `dotfiles_nodenv_repo` defaults to `https://github.com/nodenv/nodenv.git`;
  `dotfiles_nodenv_version` defaults to `latest`.
- `dotfiles_nodenv_build_directory` defaults to
  `{{ dotfiles_nodenv_directory }}/plugins/node-build`;
  `dotfiles_nodenv_build_repo` defaults to `https://github.com/nodenv/node-build.git`;
  `dotfiles_nodenv_build_version` defaults to `latest`.
- `dotfiles_goenv_install` defaults to `false`;
  `dotfiles_goenv_directory` defaults to `/home/{{ dotfiles_username }}/.goenv`;
  `dotfiles_goenv_installer` defaults to
  `https://raw.githubusercontent.com/go-nv/goenv/main/install.sh`.
- `dotfiles_pnpm_install` defaults to `false`. Enable it to install pnpm under
  `/home/{{ dotfiles_username }}/.local/share/pnpm` only when absent. It does not
  upgrade existing installations or modify shell configuration; dotfiles manage
  the `PNPM_HOME/bin` PATH entry.
- `dotfiles_pnpm_installer` defaults to `https://get.pnpm.io/install.sh`. The
  installer selects its default release; the role does not select a pnpm version.
- `dotfiles_uv_install` defaults to `false`;
  `dotfiles_uv_installer` defaults to `https://astral.sh/uv/install.sh`.
- `dotfiles_rustup_install` defaults to `false`;
  `dotfiles_rustup_installer` defaults to `https://sh.rustup.rs`.

When nodenv installation is enabled, `latest` resolves each repository's latest
stable GitHub release once per invocation. Explicit Git tags, branches, and commits
remain supported. Both checkouts update to the selected refs; tracked local changes
cause failure rather than being discarded. Repository overrides using `latest`
require public GitHub HTTPS `.git` URLs.

Node.js installation uses node-build's checksum-pinned definitions and prefers a
precompiled binary. The selected node-build checkout must include the requested
runtime definition; update it if the role reports a missing definition. Older
installed runtimes remain available. The bundled Fish configuration initializes
nodenv at its default `~/.nodenv` location; custom locations require corresponding
shell initialization.

Optional clients require network access independently of the dotfiles and Vim
online-install switches. Downloads require a valid SHA-256 checksum: kubectl uses
Kubernetes' checksum endpoint; virtctl uses the exact GitHub asset digest through
`escapace.utilities`. Missing assets or checksums fail without replacing the
installed binary. Unchanged pinned installations skip release lookup and download.
The role refuses non-regular files at the client destinations.

Choose client versions compatible with your clusters. kubectl must be within one
minor version of the Kubernetes API server; `latest` is not always suitable for
older clusters. Select virtctl for the target KubeVirt installation. The role
installs clients only; it does not configure credentials or contact clusters.

## Installation requirements

Run with root privileges and gather facts. Enable `dotfiles_nodenv_install` to
provision Node.js, or supply the selected Vim release's required Node.js version
on the user's login `PATH`. The default `lts` selection is not a guarantee of
compatibility with every Vim release; pin a suitable runtime when necessary. The released Vim configuration
also requires non-free-threaded CPython 3.12–3.14, Git 2.52+, and Neovim 0.12.x. The role installs distribution Git and
Neovim packages; ensure their versions satisfy these requirements. Online Vim
installation additionally needs uv, Tree-sitter CLI 0.26.1+, and the upstream build
prerequisites on that `PATH`. For online Vim installation, enable
`dotfiles_pnpm_install` and `dotfiles_uv_install` or provide compatible pnpm and uv
installations yourself. The default prepared offline Vim installation needs
neither pnpm nor uv, but still requires the Node.js runtime described above.

Prepared dependencies support Linux `x86_64` and `aarch64` with glibc 2.39 or newer.
A missing archive, missing digest, checksum mismatch, or invalid dependency state
fails installation; the role never falls back to online acquisition. Offline
refers to the dotfiles and Vim installers only: package installation, Git checkout,
pnpm bootstrap, Vim release lookup, and archive download still need network access. Pin a release rather than
`latest` when image builds need a fixed version.

Move any conflicting `~/.config/nvim` before invocation. The installer links it to
the Vim checkout only after dependency validation. The role refuses tracked local
Vim checkout changes; do not store customizations in its generated dependency
folders. Updates run in place; a failed update can leave dependencies incomplete
until a successful rerun. Unchanged successful Vim installations reuse recorded
release state; `latest` still checks release metadata on every run.

```yaml
- name: configure workstation user
  hosts: all
  become: true
  roles:
    - role: ansible-dotfiles
      dotfiles_username: developer
      dotfiles_vim_version: v0.1.0
```
