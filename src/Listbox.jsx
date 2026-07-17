import PropTypes from 'prop-types'
import React from 'react'
import { List } from 'react-window'

// .MuiAutocomplete-listbox pads the scroller by 8px vertically; account for
// it when sizing the visible box (rows start below the padding natively)
const LISTBOX_PADDING = 8 // px

const ITEM_SIZE = 32 // px

function Row({ index, style, items }) {
  return React.cloneElement(items[index], { style })
}

const ListboxComponent = React.forwardRef(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props
    const itemData = React.Children.toArray(children)
    const itemCount = itemData.length

    return (
      <List
        {...other}
        tagName="ul"
        rowComponent={Row}
        rowCount={itemCount}
        rowHeight={ITEM_SIZE}
        rowProps={{ items: itemData }}
        overscanCount={20}
        style={{
          height: Math.min(itemCount, 20) * ITEM_SIZE + 2 * LISTBOX_PADDING,
          maxHeight: '40vh',
        }}
        // bridge the scroll element to MUI's forked listbox ref
        listRef={(api) => {
          const node = api?.element ?? null
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
      />
    )
  },
)

ListboxComponent.propTypes = {
  children: PropTypes.node,
}

export default ListboxComponent
