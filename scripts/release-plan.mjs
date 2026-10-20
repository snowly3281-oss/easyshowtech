import {execFileSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'

// Website sources and release machinery only. Personal notes, credentials,
// debug captures and unrelated root scripts never enter an automatic commit.
export function isReleasePath(file) {
  if (/(^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|node_modules|dist|\.wrangler|\.astro)(?:\/|$)|\.(?:pem|p12|pfx|key)$/i.test(file)) return false
  return /^(?:src\/|public\/|studio\/(?:schemaTypes|components|actions|config|structure|content)\/|\.github\/workflows\/)/.test(file) ||
    /^(?:package(?:-lock)?\.json|astro\.config\.mjs|tsconfig\.json|wrangler(?:\.www-redirect)?\.jsonc|\.nvmrc|\.gitignore|sanity\.blueprint\.ts|studio\/(?:package(?:-lock)?\.json|schema\.json|sanity\.(?:config|cli)\.ts)|(?:README|SOLUTIONS_REMODEL|AUTOMATED_PUBLISHING)\.md|(?:deploy-easyshowtech|publish-site)\.(?:ps1|bat)|发布网站\.bat|scripts\/(?:publish-site\.ps1|release-plan\.mjs|deployment(?:\.test)?\.mjs|check-published-content\.mjs))$/.test(file)
}

export function createReleasePlan({changed = [], untracked = [], staged = []}) {
  const files = [...new Set([...changed, ...untracked])].sort()
  return {
    selected: files.filter(isReleasePath),
    excluded: files.filter(file => !isReleasePath(file)),
    stagedOutside: staged.filter(file => !isReleasePath(file)),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = args => execFileSync('git', args, {encoding: 'utf8'}).split('\0').filter(Boolean)
  console.log(JSON.stringify(createReleasePlan({
    changed: files(['diff', '--name-only', '--no-renames', '-z', 'HEAD']),
    untracked: files(['ls-files', '--others', '--exclude-standard', '-z']),
    staged: files(['diff', '--cached', '--name-only', '-z']),
  })))
}
