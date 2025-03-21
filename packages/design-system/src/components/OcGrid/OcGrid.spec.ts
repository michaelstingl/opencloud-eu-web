import OcGrid from './OcGrid.vue'
import { mount } from '@opencloud-eu/web-test-helpers'

describe('OcGrid', () => {
  function getWrapper(props = {}) {
    return mount(OcGrid, {
      props: props
    })
  }
  describe('gutter', () => {
    it.each(['small', 'medium', 'large', 'collapse'])(
      'should set provided gutter value',
      (gutter) => {
        const wrapper = getWrapper({
          gutter: gutter
        })
        expect(wrapper.attributes('class')).toBe('oc-grid-' + gutter)
      }
    )
  })
  describe('when direction is set to "column"', () => {
    it('should set grid flex class', () => {
      const wrapper = getWrapper({ direction: 'column' })
      expect(wrapper.attributes('class')).toContain('oc-flex')
      expect(wrapper.attributes('class')).toContain('oc-flex-middle')
    })
  })
})
