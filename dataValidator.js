#!/usr/bin/env zx

function resolveXpath(xpath) {
  return xpath
    .split('/')
    .filter((el) => el)
    .map((val) => {
      if (val.endsWith('()')) {
        return `/${val}`;
      }
      const index = val.indexOf('[');
      if (index > 0) {
        return `/*[local-name()='${val.substring(0, index)}']${val.substring(
          index
        )}`;
      } else {
        return `/*[local-name()='${val}']`;
      }
    })
    .join('');
}
async function menu(clean = true) {
  console.log(chalk.cyan('Menu:'));
  console.log(
    chalk.cyan.underline.bold(`
-sp   : data source path file/directory.
-fs   : file selector ex: <fda:list.*name=".*{-ct}">
-ct   : content type ex: picture|story etc default: picture
-xp   : xpath ex: entry/content/payload/field[@name=title]
-sf   : show selected files
-sc   : show selected contents on given xpath
-xml  : xml format data
-html : html format data
-json : json format data
-c    : clear the screen
-e    : exit
`)
  );
}
async function clear() {
  await $`clear`;
}
function printOpt(opt) {
  console.log(
    chalk.white.italic('source path(-sp):') + chalk.cyan.italic(' ' + opt.spath)
  );
  console.log(
    chalk.white.italic('content type(-ct):') +
      chalk.cyan.italic(' ' + opt.contentType)
  );
  console.log(
    chalk.white.italic('file selector(-fs):') +
      chalk.cyan.italic(' ' + opt.fileSelector)
  );
  console.log(
    chalk.white.italic('xpath(-xp):') + chalk.cyan.italic(' ' + opt.xpath)
  );
}
void (async function () {
  $.verbose = false;
  const opt = {
    spath: '/Users/jukhan/Desktop/test/sd',
    contentType: 'jasim',
    xpath: '//list/name/text()',
    fileSelector: '<list.*name=".*{-ct}">',
    xml: '/Users/jukhan/Desktop/test/sd/asd',
    json: '',
    html: '',
  };
  console.log(chalk.bgMagenta.bold('Data Validator\n'));

  let currentMenu;
  await menu();
  while (true) {
    printOpt(opt);
    currentMenu = await question('Please choose a menu option: ');
    const [key, value] = currentMenu.split('=').map((el) => el.trim());
    switch (key) {
      case '-e':
        await clear();
        return;
      case '-c':
        await clear();
        await menu();
        break;
      case '-sp':
        opt.spath = value;
        break;
      case '-ct':
        opt.contentType = value;
        break;
      case '-xp':
        opt.xpath = value;
        break;
      case '-sf':
        await selectFiles(opt);
        break;
      case '-sc':
        await selectContents(opt);
        break;
      case '-xml':
        if (value) opt.xml = value;
        await showXmlContentt(opt.xml);
        break;
    }
  }
})();
async function selectFiles(opt) {
  if (!opt.spath) {
    console.log(chalk.red.italic('Data Source Path Is Required.'));
  }
  const fs = opt.fileSelector.replace('{-ct}', opt.contentType);
  const res = await nothrow($`egrep -rli ${fs} ${opt.spath}`);
  console.log(chalk.bgGreen('Selected Files:'));
  console.log(chalk.bgBlue(res.stdout));
}
async function selectContents(opt) {
  const fs = opt.fileSelector.replace('{-ct}', opt.contentType);
  const files = await nothrow($`egrep -rli ${fs} ${opt.spath}`);
  const xpath = resolveXpath(opt.xpath);
  const res = await Promise.all(
    files.stdout
      .split('\n')
      .filter((f) => f)
      .map(async (file) => {
        const xml = await nothrow($`tail -1 ${file}`);
        const res = await $`echo ${xml.stdout}| xmllint --xpath ${xpath} -`;
        return res.stdout;
      })
  );
  console.log(chalk.bgGreen('Selected Contents:'));
  console.log(chalk.bgBlue(res.join('')));
}
async function showXmlContentt(file) {
  try {
    const xml = await nothrow($`tail -1 ${file}`);
    const res = await $`echo ${xml.stdout}| xmllint --xmlout --format -`;
    console.log(chalk.bgGreen(`xml output: ${file}`));
    console.log(chalk.bgBlue(res.stdout));
  } catch (p) {
    console.log(chalk.red.italic(`Exit code: ${p.exitCode}`));
    console.log(chalk.red.italic(`Error: ${p.stderr}`));
  }
}
