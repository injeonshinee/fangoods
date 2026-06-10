import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-pink-600">팬굿즈 도안</h1>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:text-pink-600">
            로그인
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            시작하기
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          AI로 만드는 나만의 팬 굿즈 도안
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          디자인 툴 없이도 쉽고 빠르게. 커미션의 1/10 가격으로.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-pink-500 text-white text-lg rounded-xl hover:bg-pink-600 font-semibold"
        >
          무료로 시작하기
        </Link>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: '슬로건 도안',
            desc: '텍스트 입력 + AI 배경으로 응원봉 피켓, 현수막 도안 완성',
            icon: '✏️',
            price: '2,000원~',
          },
          {
            title: '포토카드 도안',
            desc: '사진 업로드 후 AI 배경·테두리로 55×85mm 포토카드 도안 완성',
            icon: '🃏',
            price: '2,000원~',
          },
          {
            title: '유니폼 일러스트',
            desc: '팀 컬러·번호·이름 입력으로 아크릴·스티커용 유니폼 일러스트 생성',
            icon: '⚾',
            price: '3,000원~',
          },
        ].map((item) => (
          <div key={item.title} className="border rounded-2xl p-6 text-left hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
            <span className="text-sm font-bold text-pink-500">{item.price}</span>
          </div>
        ))}
      </section>
    </main>
  )
}
