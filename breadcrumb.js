const TableView = require('splunkjs/mvc/tableview')
const SearchManager = require('splunkjs/mvc/searchmanager')

const INPUT_LOOKUP = '| inputlookup childs.csv'
const LEVELS = [
  () => `${INPUT_LOOKUP}
        | stats sum(Empleados) as Empleados by Geografia
        | table Geografia Empleados`,
  (breadcrumb) => `${INPUT_LOOKUP}
        | eval path = Geografia
        | where path == "${breadcrumb}"
        | stats sum(Empleados) as Empleados by Grupo_Empresarial
        | table Grupo_Empresarial Empleados`,
  (breadcrumb) => `${INPUT_LOOKUP}
        | eval path = Geografia." > ".Grupo_Empresarial
        | where path == "${breadcrumb}"
        | stats sum(Empleados) as Empleados by Empresa
        | table Empresa Empleados`,
  (breadcrumb) => `${INPUT_LOOKUP}
        | eval path = Geografia." > ".Grupo_Empresarial." > ".Empresa
        | where path == "${breadcrumb}"
        | stats sum(Empleados) as Empleados by Director
        | table Director Empleados`
]
const CLICKABLE_COLUMNS = ['Geografia', 'Grupo_Empresarial', 'Empresa']

const search = new SearchManager({
  id: 'search',
  autostart: 'false',
  search: LEVELS[0]()
})
const table = new TableView({
  count: 10,
  drilldown: 'cell',
  wrap: 'true',
  el: $('#myTable'),
  id: 'table',
  managerid: 'search'
})

const $nav = () => document.querySelector('#nav nav ul li:nth-child(2)')

function setSearch(searchString) {
  search.set('search', searchString)
  search.startSearch()
}

function createBreadcrumbHtml(breadcrumbArray) {
  return breadcrumbArray
    .map((item, i) => `<button id="b${i + 1}">${item}</button>`)
    .join(' > ')
}

function onClickCell(event) {
  event.preventDefault()

  const { field, data } = event

  if (CLICKABLE_COLUMNS.includes(field)) {
    const value = data['click.value2']
    const breadcrumbArray = $nav()
      .textContent.split(' > ')
      .filter((item) => item)
    const currentLevel = breadcrumbArray.length

    breadcrumbArray.push(value)

    setSearch(LEVELS[currentLevel + 1](breadcrumbArray.join(' > ')))
    $nav().innerHTML = createBreadcrumbHtml(breadcrumbArray)
  }
}

function onClickBack() {
  const breadcrumbArray = $nav().textContent.split(' > ')
  const currentLevel = breadcrumbArray.length

  if (currentLevel > 0) {
    breadcrumbArray.pop()

    const newBreadcrumb = breadcrumbArray.join(' > ')

    setSearch(LEVELS[currentLevel - 1](newBreadcrumb))
    $nav().innerHTML = createBreadcrumbHtml(breadcrumbArray)
  }
}

function onClickBreadcrumb(event) {
  const {
    target: { id }
  } = event

  if (id) {
    const index = parseInt(id.slice(1))
    const breadcrumbArray = $nav().textContent.split(' > ').slice(0, index)
    const newBreadcrumb = breadcrumbArray.join(' > ')

    setSearch(LEVELS[index](newBreadcrumb))
    $nav().innerHTML = createBreadcrumbHtml(breadcrumbArray)
  }
}

$(document).ready(function () {
  table.on('click', onClickCell)

  $('#nav').on('click', '#back', onClickBack)
  $('#nav').on('click', 'nav button', onClickBreadcrumb)
})
