<script lang="ts">
	import FooterPlatform from '$lib/components/FooterPlatform.svelte';
	import UpcomingPublicEventsCarousel from '$lib/components/UpcomingPublicEventsCarousel.svelte';
	import UpcomingPaidEventsCarousel from '$lib/components/UpcomingPaidEventsCarousel.svelte';

	let { data } = $props();
</script>

<div class="isolate -my-4 px-2 lg:-mx-6 lg:px-6">
	<div class="mx-auto max-w-7xl">
		<div class="absolute right-0 left-0 -z-10 -mt-4 h-full overflow-hidden select-none lg:-mt-6">
			<svg
				class="float-blob absolute top-[-15%] right-[-25%] -z-10 w-full max-w-3xl blur-md select-none 2xl:top-[-5%] 2xl:right-[-10%] 2xl:max-w-4xl dark:blur-2xl"
				viewBox="0 0 480 480"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
			>
				<path
					class="fill-[#ddf6f8] dark:fill-[#034866]"
					d="M415,270Q425,300,426,338Q427,376,401,401Q375,426,330.5,404Q286,382,263,395Q240,408,217,394.5Q194,381,171,374Q148,367,135,346.5Q122,326,87,313.5Q52,301,52,270.5Q52,240,73,216.5Q94,193,92,162Q90,131,99,94.5Q108,58,151.5,79.5Q195,101,217.5,82Q240,63,264,78Q288,93,315.5,96Q343,99,357.5,121.5Q372,144,408,159Q444,174,424.5,207Q405,240,415,270Z"
				/>
			</svg>

			<svg
				class="float-blob-reverse absolute top-[40%] left-[-30%] -z-10 w-full max-w-2xl blur-md select-none md:top-[15%] lg:left-[-20%] 2xl:left-[-15%] 2xl:max-w-3xl dark:blur-2xl"
				viewBox="0 0 480 480"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
			>
				<path
					class="fill-titles not-dark:opacity-20 dark:fill-[#683821]"
					d="M435,273.5Q445,307,410.5,323Q376,339,365,368Q354,397,324,402Q294,407,267,434Q240,461,211.5,438.5Q183,416,167,389.5Q151,363,117,358.5Q83,354,48.5,334Q14,314,46,277Q78,240,77,213.5Q76,187,73,151.5Q70,116,87.5,85Q105,54,142.5,55Q180,56,210,44Q240,32,265,59.5Q290,87,331.5,72Q373,57,374.5,99Q376,141,416,155.5Q456,170,440.5,205Q425,240,435,273.5Z"
				/>
			</svg>
		</div>
		<section class="mx-auto grid mb-16 max-w-3xl md:min-h-[50dvh]">
			<div class="grid w-full gap-4 pt-16">
				<div class="flex flex-col">
					<h1
						class="heading-font text-titles mb-12 px-4 text-center text-3xl font-bold tracking-wider sm:mt-10 sm:text-5xl sm:leading-snug!"
					>
						Образователна платформа.
					</h1>

					<p
						class="subheading-font text-muted-foreground [&>span]:text-primary px-4 text-center sm:text-lg"
					>
						Ние предлагаме пробни изпити и учебни материали, подготвени от ученици, преподадени
						лесно и разбираемо за децата, като всеки един урок е проверен от учители с дългогодишен
						опит в сферата на образованието.
					</p>

					<a
						href="/lessons"
						class="bg-titles mx-auto mt-10 inline-block rounded-full bg-linear-to-r px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-400/30 sm:text-lg md:mt-16"
						>Започни с уроците</a
					>
				</div>
			</div>
		</section>

		<UpcomingPaidEventsCarousel events={data.upcomingPaidEvents} />

		<UpcomingPublicEventsCarousel events={data.upcomingPublicEvents} />
	</div>
</div>
<FooterPlatform />

<style>
	@keyframes floatBlob {
		0% {
			transform: translate(0px) scale(1);
		}
		50% {
			transform: translate(-120px, -180px) scale(1.05);
		}
		100% {
			transform: translate(0px) scale(1);
			rotate: 0deg;
		}
	}

	@keyframes floatBlobReverse {
		0% {
			transform: translate(0px) scale(1);
		}
		50% {
			transform: translate(60px, -80px) scale(1.05);
		}
		100% {
			transform: translate(0px) scale(1);
		}
	}

	.float-blob {
		animation: floatBlob 90s linear infinite;
	}

	.float-blob-reverse {
		animation: floatBlobReverse 90s linear infinite;
	}
</style>
