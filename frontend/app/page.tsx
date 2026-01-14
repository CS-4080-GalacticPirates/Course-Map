import TransferForm from "./TransferForm";


export default function Page(){
    return (
        <div className="min-h-screen flex flex-col">
          <header className="w-full fixed top-0 left-0 h-20 border-b border-transparent z-50  bg-[#0E1219]">
            <nav className="max-w-7xl mx-auto p-1.5 text-white text-[40px]">
              Course Map
            </nav>
          </header>

          <main className="grow flex items-center justify-center pt-20">
              <TransferForm />
          </main>
        </div>
    )
}