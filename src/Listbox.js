import React from 'react'
import PropTypes from 'prop-types'
import { VariableSizeList } from 'react-window'

const LISTBOX_PADDING = 8 // px

function renderRow(props) {
  const { data, index, style } = props
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: style.top + LISTBOX_PADDING,
    },
  })
}

const OuterElementContext = React.createContext({})

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext)
  return <div ref={ref} {...props} {...outerProps} />
})

const ListboxComponent = React.forwardRef(function ListboxComponent(
  props,
  ref
) {
  const { children, ...other } = props
  const itemData = React.Children.toArray(children)
  const itemCount = itemData.length
  const itemSize = 32

  const getChildSize = (child) => {
    return itemSize
  }

  const getHeight = () => {
    if (itemCount > 20) return 20 * itemSize
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0)
  }

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          key={itemCount}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={(index) => getChildSize(itemData[index])}
          overscanCount={20}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  )
})

ListboxComponent.propTypes = {
  children: PropTypes.node,
}

export default ListboxComponent
