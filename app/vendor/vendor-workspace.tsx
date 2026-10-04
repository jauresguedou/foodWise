'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import './vendor-workspace.css';

type Store = {
  name: string;
  campus: string;
  address: string;
  hours: string;
  contactEmail: string;
  phone: string;
  fulfillment: string[];
  status: 'Pending review' | 'Published';
};

type MenuItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  priceMinor: number;
  studentPriceMinor: number | null;
  dietary: string[];
  allergens: string[];
  isAvailable: boolean;
  isArchived: boolean;
};

type ItemDraft = {
  name: string;
  category: string;
  description: string;
  price: string;
  studentPrice: string;
  dietary: string[];
  allergens: string[];
};

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Kosher',
];
const allergenOptions = [
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree nuts',
  'Peanuts',
  'Wheat',
  'Soy',
  'Sesame',
];

const initialStore: Store = {
  name: 'Juniper & Grain',
  campus: 'North Campus',
  address: '18 College Avenue',
  hours: 'Mon-Fri, 11:00 AM-7:00 PM',
  contactEmail: 'hello@juniper.example',
  phone: '(555) 014-2026',
  fulfillment: ['Pickup', 'Delivery'],
  status: 'Pending review',
};

const initialItems: MenuItem[] = [
  {
    id: 1,
    name: 'Harvest grain bowl',
    category: 'Bowls',
    description: 'Roasted squash, farro, greens, pepitas, and lemon tahini.',
    priceMinor: 1250,
    studentPriceMinor: 895,
    dietary: ['Vegetarian'],
    allergens: ['Wheat', 'Sesame'],
    isAvailable: true,
    isArchived: false,
  },
  {
    id: 2,
    name: 'Crispy tofu greens',
    category: 'Bowls',
    description: 'Ginger tofu, brown rice, cabbage, and sesame-lime dressing.',
    priceMinor: 1100,
    studentPriceMinor: 850,
    dietary: ['Vegan', 'Dairy-free'],
    allergens: ['Soy', 'Sesame'],
    isAvailable: true,
    isArchived: false,
  },
  {
    id: 3,
    name: 'Tomato soup & toast',
    category: 'Sides',
    description: 'Slow-roasted tomato soup with sourdough toast.',
    priceMinor: 800,
    studentPriceMinor: null,
    dietary: ['Vegetarian'],
    allergens: ['Wheat'],
    isAvailable: false,
    isArchived: false,
  },
];

const emptyDraft: ItemDraft = {
  name: '',
  category: 'Bowls',
  description: '',
  price: '',
  studentPrice: '',
  dietary: [],
  allergens: [],
};

function parseMinor(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0'));
  const amount = whole * 100 + fraction;
  return Number.isSafeInteger(amount) ? amount : null;
}

function formatMoney(amountMinor: number): string {
  return `$${(amountMinor / 100).toFixed(2)}`;
}

export default function VendorWorkspace() {
  const [store, setStore] = useState(initialStore);
  const [items, setItems] = useState(initialItems);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const activeItems = items.filter((item) => !item.isArchived);
  const listedItems = items.filter((item) => item.isArchived === showArchived);
  const availableCount = activeItems.filter((item) => item.isAvailable).length;
  const unavailableCount = activeItems.length - availableCount;

  function openStoreForm(edit: boolean) {
    setEditingStore(edit);
    setShowStoreForm(true);
  }

  function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('storeName') ?? '').trim();
    const campus = String(formData.get('campus') ?? '').trim();
    const address = String(formData.get('address') ?? '').trim();
    const hours = String(formData.get('hours') ?? '').trim();
    const contactEmail = String(formData.get('contactEmail') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const fulfillment = ['Pickup', 'Delivery'].filter(
      (option) => formData.get(option) === 'on'
    );
    if (
      !name ||
      !campus ||
      !address ||
      !hours ||
      !contactEmail ||
      fulfillment.length === 0
    )
      return;

    setStore({
      name,
      campus,
      address,
      hours,
      contactEmail,
      phone,
      fulfillment,
      status: 'Pending review',
    });
    if (!editingStore) setItems([]);
    setShowStoreForm(false);
  }

  function toggleChoice(field: 'dietary' | 'allergens', choice: string) {
    setDraft((current) => ({
      ...current,
      [field]: current[field].includes(choice)
        ? current[field].filter((item) => item !== choice)
        : [...current[field], choice],
    }));
  }

  function saveMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const name = draft.name.trim();
    const description = draft.description.trim();
    const priceMinor = parseMinor(draft.price);
    const studentPriceMinor = draft.studentPrice
      ? parseMinor(draft.studentPrice)
      : null;

    if (!name) nextErrors.name = 'Enter a menu item name.';
    if (!description) nextErrors.description = 'Enter a short description.';
    if (priceMinor === null || priceMinor <= 0)
      nextErrors.price =
        'Enter a price greater than $0.00, with up to 2 decimal places.';
    if (
      draft.studentPrice &&
      (studentPriceMinor === null || studentPriceMinor <= 0)
    ) {
      nextErrors.studentPrice =
        'Enter a valid student price, or leave this blank.';
    } else if (
      studentPriceMinor !== null &&
      priceMinor !== null &&
      studentPriceMinor >= priceMinor
    ) {
      nextErrors.studentPrice =
        'Student price must be lower than the regular price.';
    }

    setItemErrors(nextErrors);
    if (Object.keys(nextErrors).length || priceMinor === null) return;

    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        name,
        category: draft.category,
        description,
        priceMinor,
        studentPriceMinor,
        dietary: draft.dietary,
        allergens: draft.allergens,
        isAvailable: true,
        isArchived: false,
      },
    ]);
    setDraft(emptyDraft);
    setItemErrors({});
    setShowItemForm(false);
  }

  function toggleAvailability(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  }

  function toggleArchived(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isArchived: !item.isArchived } : item
      )
    );
  }

  return (
    <main className="vendor-page">
      <header className="vendor-topbar">
        <Link className="vendor-brand" href="/" aria-label="FoodWise home">
          <span>FW</span> foodwise <small>VENDOR</small>
        </Link>
        <nav className="vendor-topnav" aria-label="Vendor navigation">
          <a className="selected" href="/vendor">
            Workspace
          </a>
          <Link className="vendor-view-switch" href="/">
            Meal explorer
          </Link>
        </nav>
        <button
          className="vendor-avatar"
          type="button"
          aria-label="Signed in as Juniper vendor"
        >
          JV
        </button>
      </header>

      <div className="vendor-container">
        <div className="vendor-page-heading">
          <div>
            <p className="vendor-eyebrow">
              Vendor workspace / store management
            </p>
            <h1>Good morning, Juniper.</h1>
            <p className="vendor-subtitle">
              Keep your store details current and today&apos;s menu ready.
            </p>
          </div>
          <button
            className="vendor-button vendor-button-secondary"
            onClick={() => openStoreForm(false)}
            type="button"
          >
            + Create store
          </button>
        </div>

        <p className="vendor-demo-note" role="note">
          Demo workspace. Changes are local and reset when you reload.
        </p>

        <section className="vendor-stats" aria-label="Menu overview">
          <div>
            <span>Active menu items</span>
            <strong>{activeItems.length.toString().padStart(2, '0')}</strong>
            <small>Across your store menu</small>
          </div>
          <div>
            <span>Available now</span>
            <strong>{availableCount.toString().padStart(2, '0')}</strong>
            <small>Visible as ready to order</small>
          </div>
          <div>
            <span>Marked sold out</span>
            <strong>{unavailableCount.toString().padStart(2, '0')}</strong>
            <small>Can be restored anytime</small>
          </div>
        </section>

        <section className="vendor-store-panel" aria-labelledby="store-heading">
          <div className="vendor-store-topline">
            <div className="vendor-store-mark" aria-hidden="true">
              J
            </div>
            <div className="vendor-store-title">
              <p className="vendor-eyebrow">Your store</p>
              <h2 id="store-heading">{store.name}</h2>
            </div>
            <span
              className={`vendor-status ${store.status === 'Published' ? 'is-published' : 'is-pending'}`}
            >
              {store.status}
            </span>
            <button
              className="vendor-text-button"
              onClick={() => openStoreForm(true)}
              type="button"
            >
              Edit details
            </button>
          </div>
          <div className="vendor-store-details">
            <div>
              <span>Campus</span>
              <strong>{store.campus}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{store.address}</strong>
            </div>
            <div>
              <span>Hours</span>
              <strong>{store.hours}</strong>
            </div>
            <div>
              <span>Contact</span>
              <strong>{store.contactEmail}</strong>
            </div>
            <div>
              <span>Fulfillment</span>
              <strong>{store.fulfillment.join(' · ') || 'Not set'}</strong>
            </div>
          </div>
          {store.status === 'Pending review' && (
            <p className="vendor-review-note">
              Your store is under review and won&apos;t appear in student search
              until approved.
            </p>
          )}
        </section>

        <section className="vendor-menu-section" aria-labelledby="menu-heading">
          <div className="vendor-menu-heading">
            <div>
              <p className="vendor-eyebrow">Catalog / {store.name}</p>
              <h2 id="menu-heading">
                Menu items <span>{activeItems.length}</span>
              </h2>
            </div>
            <div className="vendor-menu-actions">
              <label className="vendor-archived-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                />
                Show archived
              </label>
              <button
                className="vendor-button vendor-button-primary"
                onClick={() => {
                  setShowItemForm((open) => !open);
                  setItemErrors({});
                }}
                type="button"
              >
                {showItemForm ? 'Close form' : '+ Add menu item'}
              </button>
            </div>
          </div>

          {showItemForm && (
            <form
              className="vendor-item-form"
              onSubmit={saveMenuItem}
              noValidate
            >
              <div className="vendor-form-heading">
                <div>
                  <p className="vendor-eyebrow">Menu editor</p>
                  <h3>New menu item</h3>
                </div>
              </div>
              <div className="vendor-form-grid">
                <label className="vendor-field">
                  Item name
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    aria-invalid={Boolean(itemErrors.name)}
                    aria-describedby={
                      itemErrors.name ? 'item-name-error' : undefined
                    }
                  />
                  {itemErrors.name && (
                    <span className="vendor-field-error" id="item-name-error">
                      {itemErrors.name}
                    </span>
                  )}
                </label>
                <label className="vendor-field">
                  Category
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft({ ...draft, category: event.target.value })
                    }
                  >
                    <option>Bowls</option>
                    <option>Sandwiches</option>
                    <option>Breakfast</option>
                    <option>Sides</option>
                    <option>Drinks</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="vendor-field">
                  Regular price (USD)
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft({ ...draft, price: event.target.value })
                    }
                    aria-invalid={Boolean(itemErrors.price)}
                    aria-describedby={
                      itemErrors.price ? 'item-price-error' : undefined
                    }
                  />
                  {itemErrors.price && (
                    <span className="vendor-field-error" id="item-price-error">
                      {itemErrors.price}
                    </span>
                  )}
                </label>
                <label className="vendor-field">
                  Student price (USD){' '}
                  <span className="vendor-field-hint">Optional</span>
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={draft.studentPrice}
                    onChange={(event) =>
                      setDraft({ ...draft, studentPrice: event.target.value })
                    }
                    aria-invalid={Boolean(itemErrors.studentPrice)}
                    aria-describedby={
                      itemErrors.studentPrice
                        ? 'item-student-price-error'
                        : undefined
                    }
                  />
                  {itemErrors.studentPrice && (
                    <span
                      className="vendor-field-error"
                      id="item-student-price-error"
                    >
                      {itemErrors.studentPrice}
                    </span>
                  )}
                </label>
                <label className="vendor-field vendor-field-wide">
                  Description
                  <textarea
                    rows={2}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                    aria-invalid={Boolean(itemErrors.description)}
                    aria-describedby={
                      itemErrors.description
                        ? 'item-description-error'
                        : undefined
                    }
                  />
                  {itemErrors.description && (
                    <span
                      className="vendor-field-error"
                      id="item-description-error"
                    >
                      {itemErrors.description}
                    </span>
                  )}
                </label>
                <fieldset className="vendor-check-group">
                  <legend>Dietary information</legend>
                  {dietaryOptions.map((option) => (
                    <label key={option}>
                      <input
                        type="checkbox"
                        checked={draft.dietary.includes(option)}
                        onChange={() => toggleChoice('dietary', option)}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
                <fieldset className="vendor-check-group">
                  <legend>Contains allergens</legend>
                  {allergenOptions.map((option) => (
                    <label key={option}>
                      <input
                        type="checkbox"
                        checked={draft.allergens.includes(option)}
                        onChange={() => toggleChoice('allergens', option)}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="vendor-form-footer">
                <p role="status" aria-live="polite">
                  {Object.keys(itemErrors).length
                    ? 'Review the highlighted fields.'
                    : 'Prices are entered in USD.'}
                </p>
                <button
                  className="vendor-button vendor-button-primary"
                  type="submit"
                >
                  Add to menu
                </button>
              </div>
            </form>
          )}

          <div className="vendor-table-wrap">
            <table className="vendor-menu-table">
              <thead>
                <tr>
                  <th scope="col">Menu item</th>
                  <th scope="col">Price</th>
                  <th scope="col">Availability</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {listedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={item.isArchived ? 'is-archived' : undefined}
                  >
                    <td>
                      <div className="vendor-item-name">
                        <span className="vendor-item-icon" aria-hidden="true">
                          {item.category === 'Bowls'
                            ? '◉'
                            : item.category === 'Drinks'
                              ? '◌'
                              : '✳'}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <span>
                            {item.category} · {item.description}
                          </span>
                          <small>
                            {[
                              ...item.dietary,
                              ...item.allergens.map(
                                (allergen) =>
                                  `Contains ${allergen.toLowerCase()}`
                              ),
                            ].join(' · ') || 'No dietary or allergen details'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="vendor-price">
                        {item.studentPriceMinor !== null
                          ? formatMoney(item.studentPriceMinor)
                          : formatMoney(item.priceMinor)}
                      </strong>
                      {item.studentPriceMinor !== null && (
                        <>
                          <span className="vendor-price-old">
                            {formatMoney(item.priceMinor)}
                          </span>
                          <small className="vendor-price-label">
                            Student price
                          </small>
                        </>
                      )}
                    </td>
                    <td>
                      <span
                        className={`vendor-availability ${item.isArchived ? 'is-archived' : item.isAvailable ? 'is-available' : 'is-sold-out'}`}
                      >
                        <i aria-hidden="true" />
                        {item.isArchived
                          ? 'Archived'
                          : item.isAvailable
                            ? 'Available'
                            : 'Sold out'}
                      </span>
                    </td>
                    <td className="vendor-row-actions">
                      {!item.isArchived && (
                        <button
                          className="vendor-text-button"
                          type="button"
                          onClick={() => toggleAvailability(item.id)}
                          aria-label={`${item.isAvailable ? 'Mark' : 'Restore'} ${item.name} ${item.isAvailable ? 'sold out' : 'as available'}`}
                        >
                          {item.isAvailable ? 'Mark sold out' : 'Restore'}
                        </button>
                      )}
                      <button
                        className="vendor-text-button vendor-archive-button"
                        type="button"
                        onClick={() => toggleArchived(item.id)}
                        aria-label={`${item.isArchived ? 'Restore' : 'Archive'} ${item.name}`}
                      >
                        {item.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listedItems.length === 0 && (
              <div className="vendor-empty-state">
                <strong>
                  {showArchived
                    ? 'No archived items'
                    : 'Your menu is ready for its first item'}
                </strong>
                <span>
                  {showArchived
                    ? 'Archived items will appear here.'
                    : 'Add a dish to start building your menu.'}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {showStoreForm && (
        <div
          className="vendor-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowStoreForm(false);
          }}
        >
          <section
            className="vendor-store-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-form-heading"
          >
            <div className="vendor-form-heading">
              <div>
                <p className="vendor-eyebrow">Store profile</p>
                <h2 id="store-form-heading">
                  {editingStore ? 'Edit store details' : 'Create a store'}
                </h2>
              </div>
              <button
                className="vendor-dialog-close"
                type="button"
                aria-label="Close store form"
                onClick={() => setShowStoreForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={saveStore}>
              <div className="vendor-form-grid">
                <label className="vendor-field">
                  Store name
                  <input
                    name="storeName"
                    required
                    defaultValue={editingStore ? store.name : ''}
                  />
                </label>
                <label className="vendor-field">
                  Campus
                  <input
                    name="campus"
                    required
                    defaultValue={editingStore ? store.campus : ''}
                  />
                </label>
                <label className="vendor-field vendor-field-wide">
                  Street address
                  <input
                    name="address"
                    required
                    defaultValue={editingStore ? store.address : ''}
                  />
                </label>
                <label className="vendor-field vendor-field-wide">
                  Business hours
                  <input
                    name="hours"
                    required
                    defaultValue={editingStore ? store.hours : ''}
                    placeholder="Mon-Fri, 11:00 AM-7:00 PM"
                  />
                </label>
                <label className="vendor-field">
                  Contact email
                  <input
                    name="contactEmail"
                    type="email"
                    required
                    defaultValue={editingStore ? store.contactEmail : ''}
                  />
                </label>
                <label className="vendor-field">
                  Phone <span className="vendor-field-hint">Optional</span>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingStore ? store.phone : ''}
                  />
                </label>
                <fieldset className="vendor-check-group vendor-field-wide">
                  <legend>Fulfillment options</legend>
                  <label>
                    <input
                      name="Pickup"
                      type="checkbox"
                      defaultChecked={
                        editingStore
                          ? store.fulfillment.includes('Pickup')
                          : true
                      }
                    />
                    Pickup
                  </label>
                  <label>
                    <input
                      name="Delivery"
                      type="checkbox"
                      defaultChecked={
                        editingStore
                          ? store.fulfillment.includes('Delivery')
                          : false
                      }
                    />
                    Delivery
                  </label>
                </fieldset>
              </div>
              <p className="vendor-review-note">
                New and updated store details remain pending review.
              </p>
              <div className="vendor-form-footer">
                <button
                  className="vendor-button vendor-button-secondary"
                  type="button"
                  onClick={() => setShowStoreForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="vendor-button vendor-button-primary"
                  type="submit"
                >
                  {editingStore ? 'Save details' : 'Create store'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
