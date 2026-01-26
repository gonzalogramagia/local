import Footer from '../components/footer'

export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="max-w-xl mx-4 mt-24 lg:mx-auto">
            <main className="flex-auto min-w-0 mt-6 flex flex-col pl-3 pr-10 lg:px-0">
                {children}
                <Footer />
            </main>
        </div>
    )
}
