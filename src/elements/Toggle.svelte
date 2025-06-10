<script lang="ts">
  let {
    /**
     * The text label for the toggle.
     */
    label,

    /**
     * The current state of the toggle (true for checked, false for unchecked).
     * Can be bound using bind:checked.
     */
    checked = $bindable(), // This is the prop from the parent

    /**
     * A unique identifier for the toggle's input element.
     * Essential for associating the label with the checkbox for accessibility.
     */
    id,

    /**
     * Optional name attribute for the checkbox input.
     */
    name = undefined,

    /**
     * Optional disabled state for the toggle.
     * @default false
     */
    disabled = false,

    /**
     * Callback function to be called when the checked state changes.
     */
    checkedChanged, // New callback prop
  }: {
    label: string;
    checked: boolean;
    id: string;
    name?: string | undefined;
    disabled?: boolean;
    checkedChanged: (newCheckedState: boolean) => void; // Define the callback prop type
  } = $props();
</script>

<div class="toggle-component">
  <label for={id} class:disabled>{label}</label>
  <input
    type="checkbox"
    {id}
    {name}
    {disabled}
    bind:checked
    onchange={() => {
      if (checkedChanged) {
        checkedChanged(checked); // 'checked' here is the updated prop value
      }
    }}
  />
</div>

<style>
  .toggle-component {
    /* This div acts as the container for a single toggle item,
       mimicking the structure of the <div> elements in Settings.svelte.
       margin-bottom provides spacing when multiple toggles are stacked. */
    margin-bottom: 10px;
  }

  label {
    display: block; /* Consistent with Settings.svelte label styling */
    margin-top: 10px; /* Consistent with Settings.svelte label styling */
    margin-bottom: 4px; /* Adds a small space between the label and the checkbox below it */
    cursor: pointer;
    font-weight: normal; /* Ensures label text is not bold by default */
  }

  label.disabled {
    color: #888; /* Visually indicate the label is part of a disabled toggle */
    cursor: not-allowed;
  }

  input[type="checkbox"] {
    width: auto; /* Consistent with Settings.svelte checkbox styling */
    margin-right: 5px; /* Consistent with Settings.svelte checkbox styling */
    vertical-align: middle; /* Consistent with Settings.svelte checkbox styling */
    cursor: pointer;
  }

  input[type="checkbox"]:disabled {
    cursor: not-allowed;
  }
</style>
