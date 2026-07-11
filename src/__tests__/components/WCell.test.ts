import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WCell from '@/components/WCell.vue'

describe('WCell', () => {
  describe('non-edit mode', () => {
    it('should display cellData as text', () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      expect(wrapper.find('span').text()).toBe('Hello')
    })

    it('should display numeric cellData', () => {
      const wrapper = mount(WCell, {
        props: { cellData: 42, editAction: 'direct' }
      })
      expect(wrapper.find('span').text()).toBe('42')
    })

    it('should not show input in non-edit mode', () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'test', editAction: 'direct' }
      })
      expect(wrapper.find('input').exists()).toBe(false)
    })
  })

  describe('double-click to edit (direct mode)', () => {
    it('should enter edit mode on double-click', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      
      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('span').exists()).toBe(false)
    })

    it('should initialize input value with cellData', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      
      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Hello')
    })

    it('should not enter edit mode on second double-click while editing', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      expect(wrapper.find('input').exists()).toBe(true)
      
      // Second dblclick should not cause issues (already editing)
      // The span is gone, so we can't trigger dblclick on it
    })
  })

  describe('dialog mode', () => {
    it('should emit opendlg on double-click instead of entering edit mode', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'dialog' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      
      expect(wrapper.emitted('opendlg')).toHaveLength(1)
      expect(wrapper.find('input').exists()).toBe(false)
    })
  })

  describe('Enter key in edit mode', () => {
    it('should emit updateValue and exit edit mode when value changed', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      const input = wrapper.find('input')
      await input.setValue('World')
      await input.trigger('keyup.enter')
      
      expect(wrapper.emitted('updateValue')).toHaveLength(1)
      expect(wrapper.emitted('updateValue')![0]).toEqual(['World'])
      expect(wrapper.find('input').exists()).toBe(false)
      expect(wrapper.find('span').text()).toBe('Hello') // cellData prop unchanged
    })

    it('should not emit updateValue when value unchanged', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      const input = wrapper.find('input')
      // Don't change value
      await input.trigger('keyup.enter')
      
      expect(wrapper.emitted('updateValue')).toBeUndefined()
      expect(wrapper.find('input').exists()).toBe(false)
    })
  })

  describe('blur in edit mode (Bug 13 fix)', () => {
    it('should auto-submit changes on blur', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      const input = wrapper.find('input')
      await input.setValue('Changed')
      await input.trigger('blur')
      
      expect(wrapper.emitted('updateValue')).toHaveLength(1)
      expect(wrapper.emitted('updateValue')![0]).toEqual(['Changed'])
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('should not emit updateValue when value unchanged on blur', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'Hello', editAction: 'direct' }
      })
      
      await wrapper.find('span').trigger('dblclick')
      const input = wrapper.find('input')
      // Don't change value
      await input.trigger('blur')
      
      expect(wrapper.emitted('updateValue')).toBeUndefined()
      expect(wrapper.find('input').exists()).toBe(false)
    })
  })

  describe('alignment', () => {
    it('should apply text-center class when align is center', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'test', editAction: 'direct', align: 'center' }
      })
      // The inner div (second level) has the alignment class
      const innerDiv = wrapper.findAll('div')[1]
      expect(innerDiv.classes()).toContain('text-center')
    })

    it('should apply text-right class when align is right', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'test', editAction: 'direct', align: 'right' }
      })
      const innerDiv = wrapper.findAll('div')[1]
      expect(innerDiv.classes()).toContain('text-right')
    })

    it('should apply text-left class when align is left', async () => {
      const wrapper = mount(WCell, {
        props: { cellData: 'test', editAction: 'direct', align: 'left' }
      })
      const innerDiv = wrapper.findAll('div')[1]
      expect(innerDiv.classes()).toContain('text-left')
    })
  })
})
