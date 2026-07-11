import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WTable from '@/components/WTable.vue'
import WColumn from '@/components/WColumn.vue'

// Helper to mount WTable with WColumn children
function mountTable(options: {
  data?: any[]
  columns?: Array<{
    label?: string
    prop?: string
    width?: string
    rowSelectable?: boolean
    columnEditable?: boolean
    cellEditable?: 'direct' | 'dialog'
    sortable?: boolean
    align?: 'left' | 'center' | 'right'
    transform?: (value: any) => any
  }>
  rowSelected?: any[]
  allSelected?: boolean
} = {}) {
  const {
    data = [],
    columns = [],
    rowSelected = [],
    allSelected = false
  } = options

  return mount(WTable, {
    props: { data },
    slots: {
      default: columns.map(col => {
        return {
          components: { WColumn },
          template: `<WColumn 
            ${col.label ? `label="${col.label}"` : ''} 
            ${col.prop ? `:prop="'${col.prop}'"` : ''}
            ${col.width ? `width="${col.width}"` : ''}
            ${col.rowSelectable ? ':row-selectable="true"' : ''}
            ${col.columnEditable ? ':column-editable="true"' : ''}
            ${col.cellEditable ? `:cell-editable="'${col.cellEditable}'"` : ''}
            ${col.sortable ? ':sortable="true"' : ''}
            ${col.align ? `align="${col.align}"` : ''}
          />`
        }
      })
    },
    global: {
      stubs: {
        WCell: {
          template: '<div class="w-cell-stub">{{ cellData }}</div>',
          props: ['cellData', 'editAction', 'align']
        }
      }
    }
  })
}

describe('WTable', () => {
  describe('basic rendering', () => {
    it('should render a table element', () => {
      const wrapper = mount(WTable, {
        props: { data: [] },
        slots: { default: '' }
      })
      expect(wrapper.find('table').exists()).toBe(true)
    })

    it('should render thead and tbody', () => {
      const wrapper = mount(WTable, {
        props: { data: [] },
        slots: { default: '' }
      })
      expect(wrapper.find('thead').exists()).toBe(true)
      expect(wrapper.find('tbody').exists()).toBe(true)
    })

    it('should render correct number of rows', () => {
      const data = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 }
      ]
      const wrapper = mount(WTable, {
        props: { data },
        slots: { default: '' }
      })
      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)
    })

    it('should render empty tbody when no data', () => {
      const wrapper = mount(WTable, {
        props: { data: [] },
        slots: { default: '' }
      })
      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(0)
    })
  })
})

describe('WColumn', () => {
  describe('header rendering', () => {
    it('should render label in th', () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Name' }
      })
      expect(wrapper.find('th').text()).toContain('Name')
    })

    it('should apply width style to th', () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Name', width: '20%' }
      })
      expect(wrapper.find('th').attributes('style')).toContain('width: 20%')
    })

    it('should render sortable indicator', () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Name', prop: 'name', sortable: true }
      })
      expect(wrapper.find('span').exists()).toBe(true)
      // Default is descending (▼)
      expect(wrapper.find('span').text()).toBe('▼')
    })
  })

  describe('body cell rendering', () => {
    it('should render prop value from scope', () => {
      const wrapper = mount(WColumn, {
        props: { prop: 'name', scope: { id: 1, name: 'Alice' } }
      })
      expect(wrapper.text()).toContain('Alice')
    })

    it('should apply transform to value', () => {
      const wrapper = mount(WColumn, {
        props: { 
          prop: 'tags', 
          scope: { id: 1, tags: ['Pop', 'Rock'] },
          transform: (val: string[]) => val.join(', ')
        }
      })
      expect(wrapper.text()).toContain('Pop, Rock')
    })

    it('should apply alignment class', () => {
      const wrapper = mount(WColumn, {
        props: { prop: 'name', scope: { id: 1, name: 'Alice' }, align: 'center' }
      })
      expect(wrapper.find('div').classes()).toContain('text-center')
    })
  })

  describe('row selection', () => {
    it('should render checkbox for row selectable column in body', () => {
      const wrapper = mount(WColumn, {
        props: { rowSelectable: true, scope: { id: 1, name: 'Alice' } },
        global: {
          stubs: {} // Don't stub anything
        }
      })
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    })

    it('should render checkbox for row selectable column in header', () => {
      const wrapper = mount(WColumn, {
        props: { rowSelectable: true }
      })
      expect(wrapper.find('th input[type="checkbox"]').exists()).toBe(true)
    })

    it('should emit toggleAllSelection when header checkbox clicked', async () => {
      const wrapper = mount(WColumn, {
        props: { rowSelectable: true, allSelected: false }
      })
      await wrapper.find('th input[type="checkbox"]').trigger('change')
      expect(wrapper.emitted('toggleAllSelection')).toHaveLength(1)
    })
  })

  describe('column editable', () => {
    it('should render edit button when columnEditable', () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Genre', prop: 'genre', columnEditable: true }
      })
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('button').text()).toBe('Genre')
    })

    it('should emit editColumn when edit button clicked', async () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Genre', prop: 'genre', columnEditable: true }
      })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('editColumn')).toHaveLength(1)
      expect(wrapper.emitted('editColumn')![0]).toEqual(['genre'])
    })
  })

  describe('sortable', () => {
    it('should toggle sort direction on click', async () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Name', prop: 'name', sortable: true }
      })
      
      const sortSpan = wrapper.find('span')
      
      // First click: ascending
      await sortSpan.trigger('click')
      expect(wrapper.emitted('sortData')![0]).toEqual([{ field: 'name', ascend: true }])
      
      // Second click: descending
      await sortSpan.trigger('click')
      expect(wrapper.emitted('sortData')![1]).toEqual([{ field: 'name', ascend: false }])
      
      // Third click: ascending again
      await sortSpan.trigger('click')
      expect(wrapper.emitted('sortData')![2]).toEqual([{ field: 'name', ascend: true }])
    })

    it('should show ▲ when ascending and ▼ when descending', async () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Name', prop: 'name', sortable: true }
      })
      
      // Default is ▼ (descending)
      expect(wrapper.find('span').text()).toBe('▼')
      
      // Click to toggle to ascending
      await wrapper.find('span').trigger('click')
      expect(wrapper.find('span').text()).toBe('▲')
      
      // Click again to toggle to descending
      await wrapper.find('span').trigger('click')
      expect(wrapper.find('span').text()).toBe('▼')
    })

    it('should reset to ascending when switching sort field', async () => {
      const wrapper = mount(WColumn, {
        props: { label: 'Name', prop: 'name', sortable: true }
      })
      
      // Click once: ascending
      await wrapper.find('span').trigger('click')
      // Click again: descending
      await wrapper.find('span').trigger('click')
      expect(wrapper.find('span').text()).toBe('▼')
    })
  })

  describe('slot content', () => {
    it('should render slot content when no prop', () => {
      const wrapper = mount(WColumn, {
        props: { scope: { id: 1, name: 'Alice' } },
        slots: {
          default: '<div class="custom-slot">Custom: {{ row.name }}</div>'
        }
      })
      expect(wrapper.text()).toContain('Custom: Alice')
    })
  })
})
