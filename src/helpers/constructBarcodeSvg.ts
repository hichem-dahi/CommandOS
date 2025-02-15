import JsBarcode from 'jsbarcode'
import type { TablesInsert } from '@/types/database.types'

export function constructBarcodeRefSvg(
  barcodeRef: SVGSVGElement,
  model: string,
  product: TablesInsert<'products'>
) {
  // Clear existing content
  barcodeRef.innerHTML = ''

  // Create and render the barcode first to get its dimensions
  const barcodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  JsBarcode(barcodeGroup, model.toString(), {
    text: `${product.price} DA`,
    width: 2,
    height: 40,
    fontSize: 18,
    margin: 5,
    fontOptions: 'bold',
    displayValue: true
  })

  // Get the barcode's bounding box
  barcodeRef.appendChild(barcodeGroup)
  const barcodeBBox = barcodeGroup.getBBox()

  // Create text elements
  const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text1.setAttribute('x', '50%')
  text1.setAttribute('y', '20')
  text1.setAttribute('text-anchor', 'middle')
  text1.setAttribute('font-size', '14')
  text1.setAttribute('font-weight', 'bold')
  text1.textContent = product.code

  const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text2.setAttribute('x', '50%')
  text2.setAttribute('y', '40') // Second text lower
  text2.setAttribute('text-anchor', 'middle')
  text2.setAttribute('font-size', '16')
  text2.setAttribute('font-weight', 'bold')
  text2.textContent = product.name

  // Clear SVG and set dimensions first
  barcodeRef.innerHTML = ''
  barcodeRef.setAttribute('width', barcodeBBox.width.toString())
  barcodeRef.setAttribute('height', (barcodeBBox.height + 50).toString())
  barcodeRef.setAttribute('viewBox', `0 0 ${barcodeBBox.width} ${barcodeBBox.height + 50}`)

  // Append elements in correct order (text first, then barcode)

  barcodeRef.appendChild(barcodeGroup)
  barcodeGroup.children[1].setAttribute('transform', 'translate(5, 50)')
  barcodeRef.appendChild(text1)
  barcodeRef.appendChild(text2)

  return barcodeRef
}
