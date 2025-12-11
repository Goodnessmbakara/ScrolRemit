import { useState, useEffect, useRef } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { getAllUsernames } from '../lib/contracts'

export default function UsernameAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [allUsernames, setAllUsernames] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const { wallets } = useWallets()

  // Fetch all usernames on mount
  useEffect(() => {
    async function fetchUsernames() {
      const usernames = await getAllUsernames()
      
      // Ensure current user is in the list (fix for legacy profiles not in index)
      if (wallets && wallets[0]) {
        try {
          const { getUsername } = await import('../lib/contracts')
          const myUsername = await getUsername(wallets[0].address)
          
          if (myUsername && !usernames.some(u => u.address.toLowerCase() === wallets[0].address.toLowerCase())) {
            usernames.push({
              username: myUsername,
              address: wallets[0].address
            })
            // Optionally update index
             const currentIdx = JSON.parse(localStorage.getItem('usernameIndex') || '[]')
             if (!currentIdx.some(u => u.address.toLowerCase() === wallets[0].address.toLowerCase())) {
               currentIdx.push({ username: myUsername, address: wallets[0].address })
               localStorage.setItem('usernameIndex', JSON.stringify(currentIdx))
             }
          }
        } catch (e) {
          console.warn('Failed to fetch/index self', e)
        }
      }
      
      setAllUsernames(usernames)
    }
    fetchUsernames()
  }, [wallets])

  // Filter suggestions based on input
  useEffect(() => {
    if (!value || value.startsWith('0x')) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const searchTerm = value.startsWith('@') ? value.slice(1).toLowerCase() : value.toLowerCase()
    
    if (searchTerm.length > 0) {
      const filtered = allUsernames.filter(user =>
        user.username.toLowerCase().includes(searchTerm)
      )
      setSuggestions(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      setSuggestions(allUsernames.slice(0, 5)) // Show first 5 when empty
      setShowDropdown(allUsernames.length > 0)
    }
  }, [value, allUsernames])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    onChange(e)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0 && !value.startsWith('0x')) {
      setShowDropdown(true)
    }
  }

  const handleSuggestionClick = (username, address) => {
    if (onSelect) {
      onSelect(username, address)
    } else {
      onChange({ target: { value: `@${username}` } })
    }
    setShowDropdown(false)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const selected = suggestions[selectedIndex]
          handleSuggestionClick(selected.username, selected.address)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
      default:
        break
    }
  }

  const inputStyles = {
    width: '100%',
    padding: 'var(--spacing-md)',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family)',
    border: '2px solid var(--color-black)',
    borderRadius: 'var(--border-radius)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  }

  const containerStyles = {
    position: 'relative',
    width: '100%',
  }

  const dropdownStyles = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: '240px',
    overflowY: 'auto',
    backgroundColor: 'var(--color-white)',
    border: '2px solid var(--color-black)',
    borderRadius: 'var(--border-radius)',
    boxShadow: '4px 4px 0 var(--color-black)',
    zIndex: 1000,
  }

  const suggestionItemStyles = (isSelected) => ({
    padding: 'var(--spacing-md)',
    cursor: 'pointer',
    backgroundColor: isSelected ? 'var(--color-light-gray)' : 'transparent',
    borderBottom: '1px solid var(--color-light-gray)',
    transition: 'background-color 0.15s',
  })

  const usernameTextStyles = {
    fontWeight: 'var(--font-weight-semibold)',
    marginBottom: '4px',
  }

  const addressTextStyles = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-off-black)',
    fontFamily: 'monospace',
  }

  return (
    <div style={containerStyles}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder="@username or 0x..."
        style={inputStyles}
      />

      {showDropdown && suggestions.length > 0 && (
        <div ref={dropdownRef} style={dropdownStyles}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.address}
              style={suggestionItemStyles(index === selectedIndex)}
              onClick={() => handleSuggestionClick(suggestion.username, suggestion.address)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={usernameTextStyles}>@{suggestion.username}</div>
              <div style={addressTextStyles}>
                {suggestion.address.substring(0, 10)}...{suggestion.address.substring(suggestion.address.length - 8)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
