<style lang="scss">
	.grid-layaout-2fr {
		display: grid;
		grid-gap: 20px;
		grid-template-columns: minmax(200px, 2fr) 1fr;
		@include for-size(medium) {
			grid-template-columns: minmax(200px, 2fr);
		}
		.grid-layaout-2fr__container {
			background-color: white;
			border-left: 1px solid #e6e6e6;
			border-right: 1px solid #e6e6e6;
            :global(h2), :global(h3) {
                color: #0271ef;
            }
        }
    }
</style>

<div class="grid-layaout-2fr">
    <div class="grid-layaout-2fr__container">
        <slot name="fr-1"/>
    </div>
    <slot name="fr-2"/>
</div>