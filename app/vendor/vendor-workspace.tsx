
'use client';

import { useActionState, useCallback,  useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './vendor-workspace.css';

import {
  saveStore,
  deleteStore,
  type CreateStoreState,
} from '@/src/server/actions/vendor';
import { currencies } from '@/src/lib/currencies';

type Store = {
  name: string;
  campus: string;
  address: string;
  hours: string;
  contactEmail: string;
  phone: string;
  fulfillment: string[];
  status: 'Pending review' | 'Published' | 'Suspended';
};

type MenuItem = {
  id: string;
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


type VendorStoreData = {
  id: string;
  name: string;
  campus: string;
  address: string;
  hoursText: string;
  contactEmail: string;
  phone: string | null;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  status: 'PENDING_REVIEW' | 'PUBLISHED' | 'SUSPENDED';
  currency: string;
  menuItems: {
    id: string;
    name: string;
    category: string;
    description: string;
    priceMinor: number;
    studentPriceMinor: number | null;
    dietaryTags: string[];
    allergens: string[];
    isAvailable: boolean;
    archivedAt: Date | null;
  }[];
};

type VendorWorkspaceProps = {
  stores: VendorStoreData[];
};


const initialStoreActionState: CreateStoreState = {
  success: false,
  message: '',
  errors: {},
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

function formatMoney(amountMinor: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

function mapStoreStatus(
  status: VendorStoreData['status'],

): Store['status'] {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'SUSPENDED') return 'Suspended';
  return 'Pending review';
}


export default function VendorWorkspace({
  stores,
}: VendorWorkspaceProps) {
  const router = useRouter();

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    stores[0]?.id ?? null,
  );

  const selectedStore =
  stores.find((item) => item.id === selectedStoreId) ??
  stores[0] ??
  null;

  const storeData = selectedStore;

  const store: Store = selectedStore
    ? {
        name: selectedStore.name,
        campus: selectedStore.campus,
        address: selectedStore.address,
        hours: selectedStore.hoursText,
        contactEmail: selectedStore.contactEmail,
        phone: selectedStore.phone ?? '',
        fulfillment: [
          ...(selectedStore.pickupAvailable ? ['pickup'] : []),
          ...(selectedStore.deliveryAvailable ? ['delivery'] : []),
        ],
        status: mapStoreStatus(selectedStore.status),
      }
    : {
        name: '',
        campus: '',
        address: '',
        hours: '',
        contactEmail: '',
        phone: '',
        fulfillment: [],
        status: 'Pending review',
      };

const [showStoreForm, setShowStoreForm] = useState(false);

const saveStoreAndClose = useCallback(
  async (
    previousState: CreateStoreState,
    formData: FormData,
  ): Promise<CreateStoreState> => {
    const result = await saveStore(previousState, formData);

    if (result.success) {
      setShowStoreForm(false);
      setSelectedStoreId(null);
      router.refresh();
      }
    return result;
  },
  [router],
);

const [storeActionState, storeFormAction] = useActionState(
  saveStoreAndClose,
  initialStoreActionState,
);


  const [itemsByStoreId, setItemsByStoreId] = useState<
    Record<string, MenuItem[]>
  >({});

  const items: MenuItem[] = selectedStore
    ? (itemsByStoreId[selectedStore.id] ??
      selectedStore.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        priceMinor: item.priceMinor,
        studentPriceMinor: item.studentPriceMinor,
        dietary: [...item.dietaryTags],
        allergens: [...item.allergens],
        isAvailable: item.isAvailable,
        isArchived: item.archivedAt !== null,
      })))
    : [];

  function setItems(
    updater: MenuItem[] | ((current: MenuItem[]) => MenuItem[]),
  ) {
    if (!selectedStore) return;

    setItemsByStoreId((current) => {
      const currentItems =
        current[selectedStore.id] ??
        selectedStore.menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          description: item.description,
          priceMinor: item.priceMinor,
          studentPriceMinor: item.studentPriceMinor,
          dietary: [...item.dietaryTags],
          allergens: [...item.allergens],
          isAvailable: item.isAvailable,
          isArchived: item.archivedAt !== null,
        }));

      return {
        ...current,
        [selectedStore.id]:
          typeof updater === 'function'
            ? updater(currentItems)
            : updater,
      };
    });
  }



  const [showItemForm, setShowItemForm] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const activeItems = items.filter((item) => !item.isArchived);
  const listedItems = items.filter(
    (item) => item.isArchived === showArchived,
  );
  const availableCount = activeItems.filter(
    (item) => item.isAvailable,
  ).length;
  const unavailableCount = activeItems.length - availableCount;

  function openStoreForm(edit: boolean) {
    setEditingStore(edit);
    setShowStoreForm(true);
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
    if (!description) {
      nextErrors.description = 'Enter a short description.';
    }

    if (priceMinor === null || priceMinor <= 0) {
      nextErrors.price =
        'Enter a price greater than zero with up to two decimal places.';
    }

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

    if (Object.keys(nextErrors).length > 0 || priceMinor === null) {
      return;
    }

    setItems((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
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

  function toggleAvailability(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, isAvailable: !item.isAvailable }
          : item,
      ),
    );
  }

  function toggleArchived(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, isArchived: !item.isArchived }
          : item,
      ),
    );
  }

  return (
    <main className="vendor-page">
      <header className="vendor-topbar">
        <Link className="vendor-brand" href="/" aria-label="FoodWise home">
          <span>FW</span> foodwise <small>VENDOR</small>
        </Link>

        <nav className="vendor-topnav" aria-label="Vendor navigation">
          <Link className="selected" href="/vendor">
            Workspace
          </Link>
          <Link className="vendor-view-switch" href="/">
            Meal explorer
          </Link>
        </nav>

        <span className="vendor-avatar" aria-label="Vendor workspace">
          {store.name.slice(0, 1).toUpperCase()}
        </span>
      </header>

      <div className="vendor-container">
        <div className="vendor-page-heading">
          <div>
            <p className="vendor-eyebrow">
              Vendor workspace / store management
            </p>
            <h1>Welcome to your workspace.</h1>
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

        {stores.length > 0 && (
          <div className="vendor-store-selector">
            <label htmlFor="vendor-store-select">
              Your stores:
            </label>

            <select
              id="vendor-store-select"
              value={selectedStoreId ?? ''}
              onChange={(event) =>
                setSelectedStoreId(event.target.value)
              }
            >
              {stores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}  {item.campus}
                </option>
              ))}
            </select>
          </div>
        )}



        {storeData ? (
          <>
        <section className="vendor-stats" aria-label="Menu overview">
          <div>
            <span>Active menu items</span>
            <strong>{String(activeItems.length).padStart(2, '0')}</strong>
            <small>Across your store menu</small>
          </div>
          <div>
            <span>Available now</span>
            <strong>{String(availableCount).padStart(2, '0')}</strong>
            <small>Marked as ready to order</small>
          </div>
          <div>
            <span>Marked sold out</span>
            <strong>{String(unavailableCount).padStart(2, '0')}</strong>
            <small>Can be restored anytime</small>
          </div>
        </section>

        <section className="vendor-store-panel" aria-labelledby="store-heading">
          <div className="vendor-store-topline">
            <div className="vendor-store-mark" aria-hidden="true">
              {store.name.slice(0, 1).toUpperCase()}
            </div>

            <div className="vendor-store-title">
              <p className="vendor-eyebrow">Your store</p>
              <h2 id="store-heading">{store.name}</h2>
            </div>

            <span
              className={`vendor-status ${
                store.status === 'Published'
                  ? 'is-published'
                  : 'is-pending'
              }`}
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
            {storeData && (
  <button
    className="vendor-text-button"
    type="button"
    onClick={async () => {
      const confirmed = window.confirm(
        'Are you sure you want to delete this store? If it has menu items or orders, it will be suspended instead to preserve records.',
      );

      if (!confirmed) return;

      try {
        const result = await deleteStore(storeData.id);

        window.alert(result.message);

        if (result.success) {
          router.push('/vendor');
          router.refresh();
        }
      } catch {
        window.alert(
          'Unable to delete the store. Please try again.',
        );
      }
    }}
  >
    Delete store
  </button>
   )}
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
              <strong>{store.fulfillment.join(' Â· ') || 'Not set'}</strong>
            </div>
          </div>

          {store.status !== 'Published' && (
            <p className="vendor-review-note">
              {store.status === 'Suspended'
                ? 'Your store is suspended. Contact the administrator for more information.'
                : 'Your store is awaiting review and will not appear in student search until approved.'}
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
                      setDraft({
                        ...draft,
                        studentPrice: event.target.value,
                      })
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
                      setDraft({
                        ...draft,
                        description: event.target.value,
                      })
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
                            ? 'â—‰'
                            : item.category === 'Drinks'
                              ? 'â—Œ'
                              : 'âœ³'}
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
                                  `Contains ${allergen.toLowerCase()}`,
                              ),
                            ].join(' · ') || 'No dietary or allergen details'}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong className="vendor-price">
                        {formatMoney(
                          item.studentPriceMinor ?? item.priceMinor,
                          storeData?.currency ?? 'USD',
                        )}
                      </strong>
                      {item.studentPriceMinor !== null && (
                        <>
                          <span className="vendor-price-old">
                            {formatMoney(
                              item.priceMinor,
                              storeData?.currency ?? 'USD',
                            )}
                          </span>
                          <small className="vendor-price-label">
                            Student price
                          </small>
                        </>
                      )}
                    </td>

                    <td>
                      <span
                        className={`vendor-availability ${
                          item.isArchived
                            ? 'is-archived'
                            : item.isAvailable
                              ? 'is-available'
                              : 'is-sold-out'
                        }`}
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
      </>
    ) : (
      <section className="vendor-empty-state">
        <strong>You haven&apos;t created a store yet.</strong>
        <span>
          Create your first store to manage its details and menu.
        </span>
        <button
          className="vendor-button vendor-button-primary"
          type="button"
          onClick={() => openStoreForm(false)}
        >
          + Create your first store
        </button>
      </section>
    )}
      </div>

      {showStoreForm && (
        <div
          className="vendor-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowStoreForm(false);
            }
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
                Ã—
              </button>
            </div>

            <form action={storeFormAction}>
              {editingStore && storeData && (
                <input type="hidden" name="storeId" value={storeData.id} />
              )}
              <div className="vendor-form-grid">
                <label className="vendor-field">
                  Store name
                  <input
                    name="name"
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

                <label className="vendor-field">
                  Currency
                  <select
                    name="currency"
                    required
                    defaultValue={storeData?.currency ?? 'XOF'}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} â€” {currency.name}
                      </option>
                    ))}
                  </select>
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
                      name="pickup"
                      type="checkbox"
                      defaultChecked={
                        editingStore
                          ? store.fulfillment.includes('pickup')
                          : true
                      }
                    />
                    Pickup
                  </label>
                  <label>
                    <input
                      name="delivery"
                      type="checkbox"
                      defaultChecked={
                        editingStore
                          ? store.fulfillment.includes('delivery')
                          : false
                      }
                    />
                    Delivery
                  </label>
                </fieldset>
              </div>

              {storeActionState.message && (
                <p role="status" aria-live="polite">
                  {storeActionState.message}
                </p>
              )}

              {Object.entries(storeActionState.errors).map(
                ([field, messages]) => (
                  <p key={field} role="alert">
                    {field}: {messages.join(', ')}
                  </p>
                ),
              )}

              <p className="vendor-review-note">
                New stores require review before publication.
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
