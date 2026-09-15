export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-xl backdrop-blur-sm sm:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Affordable meals for students
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              FoodWise helps students eat well without overspending.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Discover student-friendly meals, compare affordable options, and find
              local food deals that fit your budget and schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#discover"
                className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                Explore deals
              </a>
              <a
                href="#how-it-works"
                className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="grid w-full max-w-md gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Average student savings</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">32%</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">Nearby meals</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">24 options</p>
            </div>
          </div>
        </div>

        <div id="discover" className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["Student pricing", "Budget-friendly meals with verified discounts."],
            ["Fast discovery", "Browse local vendors and available menus quickly."],
            ["Better choices", "Find meals that fit your nutrition and budget."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div id="how-it-works" className="mt-12 rounded-2xl bg-slate-900 p-6 text-white">
          <h2 className="text-2xl font-bold">How FoodWise works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-200">
            <li>Browse student-approved meal options near you.</li>
            <li>Compare price, timing, and nutrition details.</li>
            <li>Order confidently and keep more money in your pocket.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
